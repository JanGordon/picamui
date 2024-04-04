#!/usr/bin/python3

# Mostly copied from https://picamera.readthedocs.io/en/release-1.13/recipes2.html
# Run this script, then point a web browser at http:<this-ip-address>:8000
# Note: needs simplejpeg to be installed (pip3 install simplejpeg).

import io
import logging
import socketserver
from http import server
from threading import Condition, Thread
import asyncio
import websockets
from datetime import datetime

import json
import os
from picamera2 import Picamera2
from picamera2.encoders import JpegEncoder
from picamera2.outputs import FileOutput
import time

PAGE = """\
<html>
<head>
<title>picamera2 MJPEG streaming demo</title>
</head>
<body>
<h1>Picamera2 MJPEG Streaming Demo</h1>
<img src="stream.mjpg" width="640" height="480" />
</body>
</html>
"""


class StreamingOutput(io.BufferedIOBase):
    def __init__(self):
        self.frame = None
        self.condition = Condition()

    def write(self, buf):
        with self.condition:
            self.frame = buf
            self.condition.notify_all()


class StreamingHandler(server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == "/index.html":
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            l = 0
            f = open("index.html", "rb")
            data = f.read()
            self.send_header('Content-Length', len(data))
            self.end_headers()
            self.wfile.write(data)
            
            
        elif self.path == '/stream.mjpg':
            self.send_response(200)
            self.send_header('Age', 0)
            self.send_header('Cache-Control', 'no-cache, private')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
            self.end_headers()
            try:
                while True:
                    with output.condition:
                        output.condition.wait()
                        frame = output.frame
                    self.wfile.write(b'--FRAME\r\n')
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', len(frame))
                    self.end_headers()
                    self.wfile.write(frame)
                    self.wfile.write(b'\r\n')
            except Exception as e:
                logging.warning(
                    'Removed streaming client %s: %s',
                    self.client_address, str(e))
        elif self.path == "/out.js":
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            l = 0
            f = open("out.js", "rb")
            data = f.read()
            
            self.send_header('Content-Length', len(data))
            self.end_headers()
            self.wfile.write(data)

        elif self.path.startswith("/assets"):
            p = "./" + os.path.normpath(self.path).strip("/")
            print("\n a new path", p)
            try:
                self.send_response(200)
                self.send_header('Content-Type', 'image/svg+xml')
                f = open(p, "rb")
                data = f.read()
                self.send_header('Content-Length', len(data))
                self.end_headers()
                self.wfile.write(data)
            except:
                print("apprently i cant open", p)
                self.send_error(404)
            self.end_headers()
        elif self.path == "/allphotos":
            photos = []
            for f in os.listdir("./captures/photos"):
                photos.append(f)
            print(photos)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            data = json.dumps(photos).encode("utf-8")
            self.send_header('Content-Length', len(data))
            self.end_headers()
            self.wfile.write(data)
	
        elif self.path.startswith("/captures/photos"):
            p = "./" + os.path.normpath(self.path).strip("/")
            print("\n a new path", p)
            try:
                self.send_response(200)
                self.send_header('Content-Type', 'image/jpg')
                f = open(p, "rb")
                data = f.read()
                self.send_header('Content-Length', len(data))
                self.end_headers()
                self.wfile.write(data)
            except:
                print("apprently i cant open", p)
                self.send_error(404)
            self.end_headers()


        else:
            self.send_error(404)
            self.end_headers()


class StreamingServer(socketserver.ThreadingMixIn, server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


import asyncio

import websockets


async def handler(websocket):
    while True:
        try:
            message = await websocket.recv()
        except websockets.ConnectionClosedOK:
            break
        print(message)

        event = json.loads(message)
        if event["type"] == "photo":
            picam2.stop_recording()
            print("stopped rectoding")
            fn ="captures/photos/" + datetime.today().strftime('%Y%m%d') + str(len(os.listdir("./captures/photos")))
            picam2.start()
            print(fn+".jpg")
            picam2.capture_file(fn+".jpg")
            print("captrued file")
            picam2.stop()
            startStream()
            await websocket.send(json.dumps({"type": "reconnect-stream"}))
        elif event["type"] == "focus":
            print("focused to: ", event["pos"]*15)
            picam2.set_controls({"AfMode": 0 ,"LensPosition": event["pos"]*15})


async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future()  # run forever


output = StreamingOutput()
picam2 = Picamera2()

stillConfig = picam2.create_still_configuration(main={"size": (1920, 1080)}, lores={"size": (640, 480)}, display="lores")
VideoConfig = picam2.create_video_configuration(main={"size": (1920, 1080)}, lores={"size": (640, 480)}, display="lores")
previewConfig = picam2.create_video_configuration(main={"size": (640, 480)})
picam2.configure(stillConfig)
picam2.configure(previewConfig)

def startStream():
    picam2.configure(previewConfig)
    picam2.start_recording(JpegEncoder(), FileOutput(output))
startStream()
def webserver():
    

    try:
        address = ('', 8000)
        server = StreamingServer(address, StreamingHandler)
        server.serve_forever()
    finally:
        picam2.stop_recording()


if __name__ == "__main__":
    t = Thread(target=webserver)
    t.start()
    asyncio.run(main())



