/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {takeUntil} from 'rxjs/operators';
import {User} from '@app/user/models/user.model';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {combineLatest, Subject} from 'rxjs';
import {PermissionService} from '@core/services/permission.service';
import {Permission} from '@core/models/permission.model';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {MeetingModel, MeetingStage} from '@meeting/models/meeting.model';
import {VoteCardModel} from '@voting/models/vote.model';
import {VoteFacade} from '@voting/services/vote.facade';
import {PlatformLocation} from '@angular/common';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';


@Component({
  selector: 'app-voting-participants-list-modal',
  templateUrl: './voting-participants-list-modal.component.html'
})
export class VotingParticipantsListModalComponent extends AbstractModalComponent implements OnInit, OnDestroy {

  close = true;
  readonly = false;
  members: User[];
  buttonText: string;

  originalExcludedVoters: User[] = [];
  nonExcludedMembers: User[] = [];
  meetingStage = MeetingStage;
  votingStage = VoteStage;

  excludedMembersLoading = [];

  /*
  * maxExcludedVoters depends on Gaslimit of Network
  * 12 for 10 Mio Gaslimit (epn and bloxberg)
  * 20 for 16 Mio Gaslimit (Evan)
  */
  maxExcludedVoters = 12;
  formGroup: FormGroup;

  @Input() meeting: MeetingModel;
  @Input() vote: VoteCardModel;

  private unsubscribe$ = new Subject();

  constructor(protected modalRef: NgbActiveModal,
              private votingFacade: VoteFacade,
              private platform: PlatformLocation,
              private permissionService: PermissionService,
              private fb: FormBuilder) {
    super(modalRef, platform);
  }

  ngOnInit() {
    this.initForm();

    combineLatest([
      this.votingFacade.getExcludedFromVoteList(this.vote.address),
      this.votingFacade.getNonExcludedMember(this.vote.address),
      this.votingFacade.getMemberExclusionLoadingState(this.vote.address)
    ]).pipe(takeUntil(this.unsubscribe$))
      .subscribe(([excluded, nonExcluded, loadingState]) => {
        loadingState.forEach(userLoadingState => {
          const removeFrom = userLoadingState.toBeExcluded ? nonExcluded : excluded;
          const addTo = userLoadingState.toBeExcluded ? excluded : nonExcluded;

          const index = removeFrom.findIndex(user => user.address === userLoadingState.address);
          if (index !== -1) {
            addTo.push(removeFrom[index]);
            removeFrom.splice(index, 1);
          }
        });
        this.nonExcludedMembers = nonExcluded;
        this.originalExcludedVoters = excluded;
        this.formGroup.setValue({
          excludedVoters: excluded
        });
        this.excludedMembersLoading = loadingState.map(e => e.address);
      });

  }

  private initForm() {
    const user: User[] = [];
    this.formGroup = this.fb.group({
      excludedVoters: [user, Validators.maxLength(this.maxExcludedVoters)],
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  excludeMember(member: User) {
    this.nonExcludedMembers = this.nonExcludedMembers.filter(m => m.address !== member.address);
    this.formGroup.setValue({
      excludedVoters: [...this.getExcludedVoters(), member]
    });
  }

  includeMember(member: User) {
    this.nonExcludedMembers = [...this.nonExcludedMembers, member];
    this.formGroup.setValue({
      excludedVoters: this.getExcludedVoters().filter(m => m.address !== member.address)
    });
  }

  saveExcludedMembers() {
    this.votingFacade.excludeFromVote(this.vote.address, this.getExcludedVoters().map(m => m.address));
  }

  valuesChanged(): boolean {
    const excludedVoters = this.getExcludedVoters();
    if (excludedVoters && this.originalExcludedVoters && this.formGroup.valid) {
      return !(excludedVoters.length === this.originalExcludedVoters.length &&
        excludedVoters.map(m => m.address).every(m => this.originalExcludedVoters.map(om => om.address).includes(m)));
    } else {
      return false;
    }
  }

  showChangeAllowed(): boolean {
    return this.permissionService.check(Permission.VOTING_CHANGE_ALLOWED, this.meeting, this.vote);
  }

  getExcludedVoters(): User[] {
    return this.formGroup.get('excludedVoters').value;
  }
}
