/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {ImportUserRaw} from '@import-user/models/import-user.model';
import {Subject} from 'rxjs';
import {FormControl} from '@angular/forms';
import {ImportUserService} from '@import-user/services/import-user.service';

@Component({
  selector: 'app-import-users-modal',
  templateUrl: './import-users-modal.component.html'
})
export class ImportUsersModalComponent extends AbstractModalComponent {

  @Output() uploadEvent = new EventEmitter<EventTarget>();
  @Output() importClickEvent = new EventEmitter<ImportUserRaw[]>();
  @ViewChild('fileInput') fileInput: any;
  @Input() errorStack: string[];
  @Input() fileToUpload: File;
  @Input() importUsersRaw: ImportUserRaw[];
  @Input() uploadIsValid = false;
  formIsValid = false;

  eventsSubject: Subject<void> = new Subject<void>();
  jsonTextAreaControl = new FormControl();
  csvTextAreaControl = new FormControl();

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private cdr: ChangeDetectorRef,
              private importUserService: ImportUserService) {
    super(modalRef, platform);

    const template: ImportUserRaw[] = [];
    template.push({uid: 'john.doe@provider.com', name1: 'John', name2: 'Doe', role: 1});
    template.push({uid: 'jane.doe@provider.com', name1: 'Jane', name2: 'Doe', role: 2});
    this.jsonTextAreaControl.setValue(JSON.stringify(template, null, 2));
    this.jsonTextAreaControl.disable();

    template.push({uid: 'max.mustermann@provider.com', name1: 'Max', name2: 'Mustermann', role: 1});
    const csvData = importUserService.toCSV(template);
    this.csvTextAreaControl.setValue(csvData);
    this.csvTextAreaControl.disable();
  }

  onImportClick(outgoingImportUsers: ImportUserRaw[]) {
    this.importUsersRaw = outgoingImportUsers;
    this.importClickEvent.emit(outgoingImportUsers);
    this.dismiss();
  }

  onFormIsValid(formIsValid: boolean) {
    this.formIsValid = formIsValid;
    this.cdr.detectChanges();
  }

  onImportButtonClicked() {
    this.eventsSubject.next();
  }
}
