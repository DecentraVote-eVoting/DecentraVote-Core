/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input, OnInit} from '@angular/core';
import {ImportUser} from '@import-user/models/import-user.model';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {DomSanitizer} from '@angular/platform-browser';
import {TransformUtil} from '@core/utils/transform.util';
import {ImportUserService} from '@import-user/services/import-user.service';
import {FileUtil} from "@core/utils/file.util";

@Component({
  selector: 'app-export-users-modal-smart',
  template: `
    <app-export-users-modal [close]="close"
                            [disableExportJSON]="disableExportJSON"
                            [disableExportCSV]="disableExportCSV"
                            (exportJSONClick)="onExportJSON()"
                            (exportCSVClick)="onExportCSV()">
    </app-export-users-modal>`
})
export class ExportUsersModalSmartComponent extends AbstractModalComponent implements OnInit {

  @Input()
  importedUsers: ImportUser[];

  disableExportJSON = false;
  disableExportCSV = false;

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private sanitizer: DomSanitizer,
              private importUserService: ImportUserService) {
    super(modalRef, platform);
  }

  ngOnInit() {
  }

  onExportJSON() {
    this.disableExportJSON = true;

    const data = JSON.stringify(
      TransformUtil.transformImportUserToExportUser(this.importedUsers),
      null,
      2);

    FileUtil.downloadStringEncodedFile(data, '.json', this.sanitizer);

    this.disableExportJSON = false;
    this.dismiss();
  }

  onExportCSV() {
    this.disableExportCSV = true;

    const data = this.importUserService.toCSV(TransformUtil.transformImportUserToExportUser(this.importedUsers));

    FileUtil.downloadStringEncodedFile(data, '.csv', this.sanitizer);

    this.disableExportCSV = false;
    this.dismiss();
  }
}
