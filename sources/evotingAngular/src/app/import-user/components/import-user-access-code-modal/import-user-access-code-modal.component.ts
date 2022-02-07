/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {ImportUser} from '@import-user/models/import-user.model';
import {ToasterType} from '@core/models/toaster.model';
import {Subject, throwError} from 'rxjs';
import {catchError, filter, map, switchMap, takeUntil} from 'rxjs/operators';
import {SignatureModel} from '@core/models/signature.model';
import {OracleService} from '@core/services/oracle.service';
import {ToasterService} from '@core/services/toaster.service';
import {SignatureService} from '@core/services/signature.service';
import {ImportUserFacade} from '@import-user/services/import-user.facade';
import {ObjectUtil} from '@core/utils/object.util';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-import-user-access-code-modal',
  templateUrl: './import-user-access-code-modal.component.html'
})
export class ImportUserAccessCodeModalComponent extends AbstractModalComponent implements OnInit, OnDestroy {

  @Input() importUser: ImportUser;

  copiedToClipboard = false;
  accessCodeControl = new FormControl({value: '', disabled: true});
  unsubscribe$ = new Subject();

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private signatureService: SignatureService,
              private oracleService: OracleService,
              private toasterService: ToasterService,
              private importUserFacade: ImportUserFacade) {
    super(modalRef, platform);
  }

  ngOnInit() {
    this.accessCodeControl.setValue(this.importUser.accessCode);
  }

  onReplaceAccessCode() {
    const oldAccessCode = this.importUser.accessCode;

    // send request to oracle endpoint to replace access code
    this.signatureService.createSignature(false).pipe(
      switchMap((signature: SignatureModel) => {
        return this.oracleService.replaceAccessCode(this.importUser.field0, signature)
          .pipe(catchError(_ => {
            this.toasterService.addToaster({
              type: ToasterType.ERROR,
              message: 'Message.Error.Replace-Access-Code'
            });
            return throwError(_);
          }));
      })).subscribe((_) => {
      this.importUserFacade.dispatchImportUsers();
      this.toasterService.addToaster({
        type: ToasterType.SUCCESS,
        message: 'Message.Success.Replace-Access-Code'
      });
    });

    // get updated access code from store
    this.importUserFacade.getImportedUsers().pipe(
      takeUntil(this.unsubscribe$),
      map((importUsers: ImportUser[]) =>
        importUsers.find((importUser: ImportUser) =>
          importUser.field0 === this.importUser.field0
          && importUser.accessCode !== oldAccessCode)),
      filter((importUser: ImportUser) => importUser !== undefined)
    ).subscribe((importUser: ImportUser) => {
      this.accessCodeControl.setValue(importUser.accessCode);
      this.importUser = importUser;
    });
  }

  onExtendAccessCodeValidity() {
    // send request to oracle endpoint to extend access code validity
    this.signatureService.createSignature(false).pipe(
      switchMap((signature: SignatureModel) => {
        return this.oracleService.extendAccessCodeValidity(this.importUser.field0, signature)
          .pipe(catchError(_ => {
            this.toasterService.addToaster({
              type: ToasterType.ERROR,
              message: 'Message.Error.Extend-Access-Code-Validity'
            });
            return throwError(_);
          }));
      })).subscribe((_) => {
      this.importUserFacade.dispatchImportUsers();
      this.toasterService.addToaster({
        type: ToasterType.SUCCESS,
        message: 'Message.Success.Extend-Access-Code-Validity'
      });
    });
  }

  setCopyToClipboardSuccessful() {
    this.copiedToClipboard = true;
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
