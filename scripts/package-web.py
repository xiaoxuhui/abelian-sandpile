"""Reproducible offline web ZIP; only manifest-listed runtime and its manifest."""
import hashlib,json,sys,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'dist/asset-manifest.json').read_text(encoding='utf8'))
output=Path(sys.argv[1]);output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for name in sorted([x['path'] for x in manifest['files']]+['asset-manifest.json']):
        info=zipfile.ZipInfo(name,(2026,10,9,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(info,(ROOT/'dist'/name).read_bytes())
print(f'{output.name}: 13 runtime files + asset manifest; sha256 {hashlib.sha256(output.read_bytes()).hexdigest()}')
