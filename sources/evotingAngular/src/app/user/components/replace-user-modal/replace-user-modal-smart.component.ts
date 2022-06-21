/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {Component, Input, OnDestroy} from '@angular/core';
import {User} from '@user/models/user.model';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {SignatureService} from '@core/services/signature.service';
import {catchError, map, switchMap, takeUntil} from 'rxjs/operators';
import {ToasterService} from '@core/services/toaster.service';
import {ImportUserFacade} from '@import-user/services/import-user.facade';
import {from, Subject} from 'rxjs';
import {OracleService} from '@core/services/oracle.service';
import {SignatureModel} from '@core/models/signature.model';
import * as core from '@core/+state/core.actions';
import {ToasterType} from '@core/models/toaster.model';
import {FormControl} from '@angular/forms';
import {UserFacade} from '@user/services/user.facade';
import {ImportUser} from '@import-user/models/import-user.model';


@Component({
  selector: 'app-replace-user-modal-smart',
  template: `
    <app-replace-user-modal [close]="close"
                            (replaceUserClick)="onReplaceUser()"
                            [accessCode]="accessCodeControl">
    </app-replace-user-modal>`
})
export class ReplaceUserModalSmartComponent extends AbstractModalComponent implements OnDestroy {
  @Input()
  user: User;

  private unsubscribe$ = new Subject();
  accessCodeControl = new FormControl({value: '', disabled: true});


  constructor(protected modalRef: NgbActiveModal,
              private signatureService: SignatureService,
              private toasterService: ToasterService,
              private platform: PlatformLocation,
              private importUserFacade: ImportUserFacade,
              private oracleService: OracleService,
              private userFacade: UserFacade) {
    super(modalRef, platform);
  }

  onReplaceUser() {
    this.signatureService.createSignature(false).pipe(
      takeUntil(this.unsubscribe$),
      switchMap( (signature: SignatureModel) => {
        return this.oracleService.replaceUser(this.user, signature);
      }),
      catchError(err => from([
        core.ErrorAction({message: err && err.message}),
        core.NotificationAction({
          level: ToasterType.ERROR,
          message: 'Message.Error.Replace-User', err
        })
      ]))
    ).subscribe((_: string) => {
      this.importUserFacade.dispatchImportUsers(); // this is for updating the import user list
    });

    // get updated access code from store
    this.importUserFacade.getImportedUsers().pipe(
      takeUntil(this.unsubscribe$),
      map((importUserArray: ImportUser[]) => {
        importUserArray.filter((importUser) => {
          if (importUser.uid === this.user.resolvedClaim.uid) {
            this.accessCodeControl.setValue(importUser.accessCode);
          }
        });
      }),
    ).subscribe(_ => {
      // TODO: user should be removed only when the user is logged in, not right here
      // if this is gone you have to update the site or it will display the old and new user until refresh
      this.userFacade.invalidateUser(this.user.address, this.user.claimHash);
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
