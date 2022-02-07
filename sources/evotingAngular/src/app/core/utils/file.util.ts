/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import mime = require('mime-types');
import fileSaver = require('file-saver');
import {SafeResourceUrl} from "@angular/platform-browser";
import {DateUtil} from "@core/models/date.util";
import {SecurityContext} from "@angular/core";

export class FileUtil {

  static downloadFile(file: File, filename: string) {
    const contentType: string = mime.contentType(filename);
    const blob = new Blob([file], {type: contentType});
    fileSaver.saveAs(blob, filename);
  }

  static downloadStringEncodedFile(data: any, fileEnding: string, sanitizer){
    const downloadUrl: SafeResourceUrl = sanitizer.bypassSecurityTrustUrl('data:text/csv;charset=UTF-8,'
      + encodeURIComponent(data));
    const filename: string = 'export-' + DateUtil.formatNow() + fileEnding;

    const link = document.createElement('a');
    link.href = sanitizer.sanitize(SecurityContext.URL, downloadUrl);
    link.download = filename;
    link.click();
  }

}
