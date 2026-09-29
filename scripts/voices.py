"""Turns text into wav files with Kokoro. Called by voices.mjs: reads {"file.wav": "text"} JSON on stdin."""
import json
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

model_dir, voice, speed = sys.argv[1], sys.argv[2], float(sys.argv[3])
kokoro = Kokoro(f"{model_dir}/kokoro-v1.0.onnx", f"{model_dir}/voices-v1.0.bin")
for path, text in json.load(sys.stdin).items():
    samples, rate = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
    sf.write(path, samples, rate)
