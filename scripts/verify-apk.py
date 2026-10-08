"""Check APK binary identity, fixed v2 certificate and every shipped web byte."""
import hashlib, importlib.util, json, sys, zipfile, struct
from pathlib import Path
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding
ROOT=Path(__file__).resolve().parents[1]
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
    result=importlib.util.module_from_spec(spec);spec.loader.exec_module(result);return result
manifest_parser=module('apk_manifest','apk-manifest.py')
certificate_parser=module('apk_cert','apk-v2-cert.py')
def binary_profile(buf):
    pos=8;strings=[];sdk={};uses=[];definitions={}
    while pos<len(buf):
        typ,header,size=struct.unpack_from('<HHI',buf,pos)
        if typ==1:strings,_=manifest_parser.parse_string_pool(buf,pos)
        elif typ==0x102:
            name,start,attr_size,count=struct.unpack_from('<IHHH',buf,pos+20)
            tag=strings[name];p=pos+16+start;attrs={}
            for _ in range(count):
                ns,n,raw,tval,data=struct.unpack_from('<IIIII',buf,p)
                attrs[strings[n]]=strings[data] if ((tval>>24)&255)==3 else data;p+=attr_size
            if tag=='uses-sdk':sdk=attrs
            if tag.startswith('uses-permission'):uses.append(attrs['name'])
            if tag=='permission':definitions[attrs['name']]=attrs.get('protectionLevel')
        pos+=size
    own='com.xiaoxuhui.abeliansandpile.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
    assert sdk=={'minSdkVersion':24,'targetSdkVersion':34},sdk
    assert uses==[own] and definitions.get(own)==2,(uses,definitions)
    return {'sdk':sdk,'systemPermissions':[],'androidxSignatureGuard':own,'guardProtectionLevel':2}
def verify(apk):
    pkg=json.loads((ROOT/'package.json').read_text(encoding='utf8'))
    with zipfile.ZipFile(apk) as z:
        manifest=manifest_parser.extract(z.read('AndroidManifest.xml'))
        assert manifest['package']=='com.xiaoxuhui.abeliansandpile',manifest
        assert manifest['versionName']==pkg['version'],manifest
        assert manifest['versionCode']==1,manifest
        profile=binary_profile(z.read('AndroidManifest.xml'))
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
            'manifest':manifest,'binaryProfile':profile,'webFilesMatched':len(wanted),'certificateDERByteMatch':True,
            'certificateSha256':hashlib.sha256(cert).hexdigest(),'certificateSubject':keystore_cert.subject.rfc4514_string(),
            'certificateNotBefore':keystore_cert.not_valid_before_utc.isoformat(),'certificateNotAfter':keystore_cert.not_valid_after_utc.isoformat()}
    print(json.dumps(result,ensure_ascii=False,indent=2));return result
if __name__=='__main__':verify(Path(sys.argv[1]))
