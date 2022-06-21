/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component} from '@angular/core';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {ToasterType} from '@core/models/toaster.model';
import {ImportUserRaw} from '@import-user/models/import-user.model';
import {ToasterService} from '@core/services/toaster.service';
import {ImportUserService} from '@import-user/services/import-user.service';
import {ImportUserFacade} from '@import-user/services/import-user.facade';

@Component({
  selector: 'app-import-users-modal-smart',
  template: `
    <app-import-users-modal [close]="close"
                            [uploadIsValid]="uploadIsValid"
                            [errorStack]="errorStack"
                            [fileToUpload]="fileToUpload"
                            [importUsersRaw]="importUsersValidated"
                            (uploadEvent)="onUploadFile($event)"
                            (importClickEvent)="onImportUsers($event)">
    </app-import-users-modal>`
})
export class ImportUsersModalSmartComponent extends AbstractModalComponent {

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private toasterService: ToasterService,
              private importService: ImportUserService,
              private importUserFacade: ImportUserFacade) {
    super(modalRef, platform);
  }

  importUsersValidated: ImportUserRaw[];
  errorStack: string[] = [];
  uploadIsValid = false;
  fileToUpload: File;
  fileExtensionName: string;

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
    if (!(file instanceof Blob)) {
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        try {
          this.parseUploadedFile(reader.result as string, this.fileExtensionName);
        } catch (e) {
          this.errorStack.push(e.message);
        }
      } else {
        this.errorStack.push('User.Import.Error-Empty-File');
      }
      this.uploadIsValid = this.errorStack.length === 0;
    };
    reader.readAsText(file);
  }

  parseUploadedFile(fileContent, fileExtensionName) {
    switch (fileExtensionName) {
      case 'json': {
        const importUserRaw = this.importService.parseJson(fileContent);
        this.importUsersValidated = this.importService.validateImportUserRawObject(importUserRaw);
        break;
      }
      case 'csv': {
        const importUserRaw = this.importService.parseCSV(fileContent);
        this.importUsersValidated = this.importService.validateImportUserRawObject(importUserRaw);
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
