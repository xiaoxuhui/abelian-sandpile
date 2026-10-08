import {runtimeFiles} from './build.mjs';
export const ASSETS_DIR='android/app/src/main/assets';
export const ENTRY_PAGE='index.html';
export const SYNC_ITEMS=runtimeFiles.map(file=>({type:'file',from:'dist/'+file,to:file}));
