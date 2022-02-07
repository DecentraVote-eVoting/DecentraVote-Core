/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {ImportUserFields, ImportUserRaw} from '@import-user/models/import-user.model';
import {Subject} from 'rxjs';
import {FormControl} from '@angular/forms';
import {ImportUserService} from '@import-user/services/import-user.service';

@Component({
  selector: 'app-import-users-modal',
  templateUrl: './import-users-modal.component.html'
})
export class ImportUsersModalComponent extends AbstractModalComponent implements OnInit {

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
    template.push({field0: 'john.doe@provider.com', field1: 'John', field2: 'Doe', role: 1});
    template.push({field0: 'jane.doe@provider.com', field1: 'Jane', field2: 'Doe', role: 2});
    this.jsonTextAreaControl.setValue(JSON.stringify(template, null, 2));
    this.jsonTextAreaControl.disable();

    template.push({field0: 'max.mustermann@provider.com', field1: 'Max', field2: 'Mustermann', role: 1});
    const csvData = importUserService.toCSV(template);
    this.csvTextAreaControl.setValue(csvData);
    this.csvTextAreaControl.disable();
  }

  ngOnInit() {
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
