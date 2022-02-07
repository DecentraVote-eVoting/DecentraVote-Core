/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, OnInit} from '@angular/core';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {ToasterType} from '@core/models/toaster.model';
import {ImportUserRaw} from '@import-user/models/import-user.model';
import {ToasterService} from '@core/services/toaster.service';
import {ImportUserService} from '@import-user/services/import-user.service';
import {SignatureService} from '@core/services/signature.service';
import {ImportUserFacade} from '@import-user/services/import-user.facade';

@Component({
  selector: 'app-import-users-modal-smart',
  template: `
    <app-import-users-modal [close]="close"
                            [uploadIsValid]="uploadIsValid"
                            [errorStack]="errorStack"
                            [fileToUpload]="fileToUpload"
                            [importUsersRaw]="importUsersRaw"
                            (uploadEvent)="onUploadFile($event)"
                            (importClickEvent)="onImportUsers($event)">
    </app-import-users-modal>`
})
export class ImportUsersModalSmartComponent extends AbstractModalComponent implements OnInit {

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private toasterService: ToasterService,
              private importService: ImportUserService,
              private signatureService: SignatureService,
              private importUserFacade: ImportUserFacade) {
    super(modalRef, platform);
  }

  importUsersRaw: ImportUserRaw[];
  errorStack: string[] = [];
  uploadIsValid = false;
  fileToUpload: File;
  fileExtensionName: string;

  ngOnInit() {
  }

  onUploadFile(event: EventTarget) {
    const element = event as HTMLInputElement;
    this.errorStack = [];
    this.fileToUpload = this.getFileFromEvent(element);
    this.fileExtensionName = this.getFileExtension(this.fileToUpload.name);
    this.readFile(this.fileToUpload);
  }

  onImportUsers(importUsersRaw: ImportUserRaw[]) {
    this.importUserFacade.importUsers(importUsersRaw);
  }

  getFileFromEvent(event: HTMLInputElement): File {
    return event && event.files && event.files.item(0);
  }

  getFileExtension(fileName: string): string {
    return fileName.split('.').pop();
  }

  readFile(file: File) {
    this.importService.readFile(file, new FileReader()).subscribe(fileContent => {
      if (fileContent) {
        try {
          this.parseUploadedFile(fileContent, this.fileExtensionName);
        } catch (e) {
          this.errorStack.push(e.message);
        }
      } else {
        this.errorStack.push('User.Import.Error-Empty-File');
      }
      this.uploadIsValid = this.errorStack.length === 0;
    });
  }

  parseUploadedFile(fileContent, fileExtensionName) {
    switch (fileExtensionName) {
      case 'json': {
        const json = this.importService.parseJson(fileContent);
        this.importUsersRaw = this.importService.validateJson(json);
        break;
      }
      case 'csv': {
        const json = this.importService.parseCSV(fileContent);
        this.importUsersRaw = this.importService.validateJson(json);
        break;
      }
      default: {
        this.uploadIsValid = false;
        this.toasterService.addToaster({
          type: ToasterType.ERROR,
          message: 'User.Import.Error-Invalid-Extension'
        });
        this.errorStack.push('User.Import.Error-Invalid-Extension');
        break;
      }
    }
  }
}
