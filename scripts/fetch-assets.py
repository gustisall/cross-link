"""Prepare the licensed, real tool photographs used by CrossLink.

Run with Python + Pillow. Downloaded originals are inspected before cropping;
bounding boxes below were chosen after visual inspection of the source photograph.
No generative editing or reconstruction is used.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)
KIT_SOURCE = "https://commons.wikimedia.org/wiki/File:Cable_stripper,_cable_tester_(RJ45,_RJ11),_LSA-Tool_and_crimping_tool.jpg"
KIT_URL = "https://upload.wikimedia.org/wikipedia/commons/1/18/Cable_stripper%2C_cable_tester_%28RJ45%2C_RJ11%29%2C_LSA-Tool_and_crimping_tool.jpg"

SOURCES = [
    {"toolId":"cable", "title":"Kabel UTP biru", "author":"Hatschepsut (Polish Wikipedia)", "source":"https://commons.wikimedia.org/wiki/File:UTP_cable-blue.jpg", "originalUrl":"https://upload.wikimedia.org/wikipedia/commons/4/40/UTP_cable-blue.jpg", "license":"CC BY-SA 3.0", "licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/", "original":"cable-original.jpg"},
    {"toolId":"connector", "title":"Konektor 8P8C pada kabel", "author":"David Monniaux; crop by Pittigrilli", "source":"https://commons.wikimedia.org/wiki/File:Ethernet_RJ45_connector_p1160054.jpg", "originalUrl":"https://upload.wikimedia.org/wikipedia/commons/d/d7/Ethernet_RJ45_connector_p1160054.jpg", "license":"CC BY-SA 3.0", "licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/", "original":"connector-original.jpg"},
    {"toolId":"stripper", "title":"Pengupas jaket kabel", "author":"www.heimnetzwerke.net", "source":KIT_SOURCE, "originalUrl":KIT_URL, "license":"CC BY 4.0", "licenseUrl":"https://creativecommons.org/licenses/by/4.0/", "original":"toolkit-original.jpg", "crop":[.125,.225,.45,.405]},
    {"toolId":"cutter", "title":"Tang potong diagonal", "author":"Securiger (English Wikipedia)", "source":"https://commons.wikimedia.org/wiki/File:Side_cutters.jpg", "originalUrl":"https://upload.wikimedia.org/wikipedia/commons/a/ab/Side_cutters.jpg?download=1", "license":"CC BY-SA 3.0", "licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/", "original":"cutter-original.jpg"},
    {"toolId":"crimper", "title":"Tang crimp modular 8P8C", "author":"www.heimnetzwerke.net", "source":KIT_SOURCE, "originalUrl":KIT_URL, "license":"CC BY 4.0", "licenseUrl":"https://creativecommons.org/licenses/by/4.0/", "original":"toolkit-original.jpg", "crop":[.685,.105,.88,.865]},
    {"toolId":"tester", "title":"LAN tester MAIN dan REMOTE", "author":"www.heimnetzwerke.net", "source":KIT_SOURCE, "originalUrl":KIT_URL, "license":"CC BY 4.0", "licenseUrl":"https://creativecommons.org/licenses/by/4.0/", "original":"toolkit-original.jpg", "crop":[.115,.40,.445,.865]},
]

credits = []
for source in SOURCES:
    original = ASSETS / source["original"]
    if not original.exists():
        request = Request(source["originalUrl"], headers={"User-Agent":"CrossLinkEducationalAssets/1.0"})
        with urlopen(request, timeout=30) as response:
            original.write_bytes(response.read())
    with Image.open(original) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        if "crop" in source:
            width, height = image.size
            x0,y0,x1,y1 = source["crop"]
            image = image.crop((round(x0*width),round(y0*height),round(x1*width),round(y1*height)))
        image.thumbnail((1000,1000), Image.Resampling.LANCZOS)
        target = ASSETS / (source["toolId"] + ".jpg")
        image.save(target, quality=86, optimize=True)
    entry = {key:value for key,value in source.items() if key not in ("original","crop")}
    entry["path"] = "/assets/" + target.name
    entry["changes"] = "Cropped from the toolkit photograph and resized; metadata removed." if "crop" in source else "Resized and JPEG optimized; metadata removed."
    credits.append(entry)
    print(target.name, image.size, target.stat().st_size)

(ASSETS / "credits.json").write_text(json.dumps(credits,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
for original_name in {source["original"] for source in SOURCES}:
    (ASSETS / original_name).unlink(missing_ok=True)
