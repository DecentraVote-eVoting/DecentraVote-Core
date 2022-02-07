/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {MeetingDetailModel} from '@meeting/models/meeting.model';
import {VoteDetailModel, VoteDetailTab, VoteResult} from '@voting/models/vote.model';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {PlatformLocation} from '@angular/common';

@Component({
  selector: 'app-voting-detail-modal',
  templateUrl: './voting-detail-modal.component.html'
})
export class VotingDetailModalComponent extends AbstractModalComponent {

  @Input()
  set vote(vote: VoteDetailModel) {
    if (vote) {
      this._vote = vote;
      if (vote.externalChange !== true) {
        this.initForm();
      }
    }
  }

  get vote(): VoteDetailModel {
    return this._vote;
  }

  @Input() meeting: MeetingDetailModel;
  @Input() castVoteLoading = false;

  @Output() castVoteAction = new EventEmitter<[string[], number]>();
  @Output() exportButtonClick = new EventEmitter();
  @Output() verifyVotesAction = new EventEmitter();

  voteDetailTab = VoteDetailTab;
  activeTab: VoteDetailTab = VoteDetailTab.RESULT_OVERVIEW;

  formArray: FormGroup[] = [];
  selectedFormIndex = 0;
  voteStage = VoteStage;
  anonymousControl = new FormControl();
  nextIndex = 0;
  private _vote: VoteDetailModel;

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private fb: FormBuilder) {
    super(modalRef, platform);
  }

  private initForm() {
    this.formArray = [];
    const numberOfVoteOptionGroups =
      (this.vote.stage === VoteStage.CREATED || this.vote.stage === VoteStage.ARCHIVED) || !this.hasVoteRights()
        // We need to display at least one formGroup if you dont have vote rights or the stage is < open && <archived
        ? 1
        // else there are as many formGroups created as you have vote rights
        : this.vote.numberOfOwnVoteRights;

    for (let i = 0; i < numberOfVoteOptionGroups; i++) {
      this.formArray.push(this.createFormGroup(i));
    }
    this.anonymousControl.setValue(this.vote.isAnonymous);
    this.anonymousControl.disable();
  }

  private createFormGroup(index: number): FormGroup {
    return this.fb.group({
      option: new FormControl({
        value: this.vote.ownVoteOptions[index] ? this.vote.ownVoteOptions[index] : undefined,
        disabled: true
      }, Validators.required),
    });
  }

  prevButtonEnabled() {
    return this.selectedFormIndex > 0;
  }

  nextButtonEnabled() {
    if (this.selectedFormIndex === this.formArray.length - 1) { return false; }

    if (this.vote.stage > this.voteStage.OPENED) {
      return true;
    } else {
      const selectedOptions = this.formArray
        .slice(this.vote.numberOfOwnVotesCast)
        .map(c => c.get('option').value === undefined ? 0 as number : 1 as number)
        .reduce((a, b) => a + b, 0);
      return (this.selectedFormIndex < this.vote.numberOfOwnVotesCast + selectedOptions);
    }
  }

  castVote() {
    const value = this.formArray.slice(this.vote.ownVoteOptions.length, this.formArray.length)
      .map(c => c.get('option').value)
      .filter(c => !!c);
    const startIndex = this.vote.ownVoteOptions.length;
    if (value && value.length !== 0) {
      this.castVoteAction.emit([value, startIndex]);
    }
  }

  getResultByOption(option: string): VoteResult {
    return (this.vote.result || []).find(r => r.name === option);
  }

  decreaseIndex() {
    if (this.prevButtonEnabled()) {
      this.selectedFormIndex--;
    }
  }

  increaseIndex() {
    if (this.nextButtonEnabled()) {
      this.selectedFormIndex++;
    }
  }

  isFormArrayInvalid() {
    return this.formArray && this.formArray.filter(c => c.dirty).length === 0;
  }

  getFormGroupByIndex(): FormGroup {
    if (this.formArray && this.formArray[this.selectedFormIndex]) {
      if (this.vote.stage === VoteStage.OPENED
        && this.vote.ownVoteOptions[this.selectedFormIndex] === undefined
        && this.hasVoteRights()
        && (this.meeting && !this.meeting.hasGivenAuthority)
        && this.castVoteLoading === false
        && (!this.vote.isAnonymous || this.isAnonymousVoteReady())) {
        this.formArray[this.selectedFormIndex].enable();
      } else {
        this.formArray[this.selectedFormIndex].disable();
      }
    }
    return this.formArray && this.formArray[this.selectedFormIndex] as FormGroup;
  }

  isAnonymousVoteReady(): boolean {
    return this.selectedFormIndex < (this.vote.anonymousAccountsRegistered || []).length;
  }

  getOptionControl(formGroup: FormGroup): FormControl {
    return formGroup && formGroup.get('option') as FormControl;
  }

  onTabChange(tab: VoteDetailTab) {
    this.activeTab = tab;
  }

  showVerifyVotes() {
    return this.vote.stage === VoteStage.COUNTED && this.vote.numberOfTotalVotesCast > 0;
  }

  hasVoteRights() {
    return this.vote.numberOfOwnVoteRights > 0;
  }

  hasVoteRightsLeft() {
    return this.vote.numberOfOwnVoteRights - this.vote.numberOfOwnVotesCast > 0;
  }
}
