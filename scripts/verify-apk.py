"""Check APK binary identity, fixed v2 certificate and every shipped web byte."""
import hashlib, importlib.util, json, sys, zipfile
from pathlib import Path
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding
ROOT=Path(__file__).resolve().parents[1]
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
    result=importlib.util.module_from_spec(spec);spec.loader.exec_module(result);return result
manifest_parser=module('apk_manifest','apk-manifest.py')
certificate_parser=module('apk_cert','apk-v2-cert.py')
def verify(apk):
    pkg=json.loads((ROOT/'package.json').read_text(encoding='utf8'))
    with zipfile.ZipFile(apk) as z:
        manifest=manifest_parser.extract(z.read('AndroidManifest.xml'))
        assert manifest['package']=='com.xiaoxuhui.abeliansandpile',manifest
        assert manifest['versionName']==pkg['version'],manifest
        assert manifest['versionCode']==1,manifest
        plan=json.loads((ROOT/'dist/asset-manifest.json').read_text(encoding='utf8'))
        wanted={f['path'] for f in plan['files']}
        actual={n[len('assets/'):] for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')}
        assert actual==wanted,(actual-wanted,wanted-actual)
        for name in sorted(wanted):
            assert z.read('assets/'+name)==(ROOT/'dist'/name).read_bytes(),name
        assert 'res/raw/apache_2_0.txt' in z.namelist()
        assert 'res/raw/third_party_notices.txt' in z.namelist()
    cert=certificate_parser.extract_v2_cert(str(apk))
    _,keystore_cert,_=pkcs12.load_key_and_certificates((ROOT/'android/app/debug.keystore').read_bytes(),b'android')
    assert cert==keystore_cert.public_bytes(Encoding.DER),'APK v2 certificate differs from fixed keystore'
    result={'apk':Path(apk).name,'bytes':Path(apk).stat().st_size,'sha256':hashlib.sha256(Path(apk).read_bytes()).hexdigest(),
            'manifest':manifest,'webFilesMatched':len(wanted),'certificateDERByteMatch':True,
            'certificateSha256':hashlib.sha256(cert).hexdigest(),'certificateSubject':keystore_cert.subject.rfc4514_string(),
            'certificateNotBefore':keystore_cert.not_valid_before_utc.isoformat(),'certificateNotAfter':keystore_cert.not_valid_after_utc.isoformat()}
    print(json.dumps(result,ensure_ascii=False,indent=2));return result
if __name__=='__main__':verify(Path(sys.argv[1]))
