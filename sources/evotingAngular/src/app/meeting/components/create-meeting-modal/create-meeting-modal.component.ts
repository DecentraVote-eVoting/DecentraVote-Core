/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {MeetingModel} from '../../models/meeting.model';
import {User} from '@app/user/models/user.model';
import {StorageService} from '@core/services/storage.service';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {MeetingFacade} from '../../services/meeting.facade';
import {PlatformLocation} from '@angular/common';
import 'rxjs-compat/add/observable/empty';
import {UserFacade} from '@app/user/services/user.facade';


@Component({
  selector: 'app-create-meeting-modal',
  templateUrl: './create-meeting-modal.component.html'
})
export class CreateMeetingModalComponent extends AbstractModalComponent implements OnInit, OnDestroy {

  @Input() prefillData: MeetingModel;


  form: FormGroup;

  memberListOpen = false;
  selectedChairperson: User;
  private unsubscribe$ = new Subject();

  constructor(protected modalRef: NgbActiveModal,
              private meetingFacade: MeetingFacade,
              private storageService: StorageService,
              private platform: PlatformLocation,
              private fb: FormBuilder,
              private formBuilder: FormBuilder,
              private memberFacade: UserFacade) {
    super(modalRef, platform);
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      title: [this.prefillData && this.prefillData.title || '', [Validators.required, Validators.maxLength(100)]],
      description: [this.prefillData && this.prefillData.description || ''],
      startDate: [new Date(), [Validators.required]],
      endDate: [new Date(), [Validators.required]]
    }, {
      validators: [this.dateComparisonValidator()],
    });

    this.form.setValidators(this.dateComparisonValidator());

    if (this.prefillData && this.prefillData.chairperson) {
      this.memberFacade.getUserByAddress(this.prefillData.chairperson).pipe(takeUntil(this.unsubscribe$))
        .subscribe(user => {
          this.selectedChairperson = user;
        });
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  createMeeting() {
    const newMeeting: MeetingModel = {
      ...this.form.value,
      chairperson: this.selectedChairperson.address,
      address: '',
      votingCount: 0,
      stage: 0,
    };
    this.meetingFacade.createMeeting(newMeeting);
    this.modalRef.close();
  }

  setChairperson(person: User) {
    this.selectedChairperson = person;
  }

  updateMeeting() {
    const updateMeeting: MeetingModel = {
      ...this.form.value,
      chairperson: this.selectedChairperson.address,
      address: this.prefillData.address,
    };
    this.meetingFacade.updateMeeting(updateMeeting);
    this.modalRef.close();
  }

  toggleMemberList() {
    this.memberListOpen = !this.memberListOpen;
  }

  getChairpersonName() {
    if (!this.selectedChairperson) {
      return '';
    } else {
      return this.selectedChairperson.resolvedClaim.field1 + ' ' +
        this.selectedChairperson.resolvedClaim.field2;
    }
  }

  public dateComparisonValidator(): ValidatorFn {
    return (form: FormGroup): ValidationErrors | null => {
      const startDate = form.controls['startDate'];
      const endDate = form.controls['endDate'];
      if (startDate.value <= endDate.value) {
        return null; // null = form is valid
      } else {
        return {isDateRight: true};
      }
    };
  }

}


