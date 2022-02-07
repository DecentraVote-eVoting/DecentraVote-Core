/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {FormControl, Validators} from '@angular/forms';
import {VoteFacade} from '@voting/services/vote.facade';
import {VoteCardModel} from '@voting/models/vote.model';
import {PlatformLocation} from '@angular/common';

@Component({
  selector: 'app-archive-voting-modal',
  templateUrl: './archive-voting-modal.component.html'
})
export class ArchiveVotingModalComponent extends AbstractModalComponent {

  @Input() voteModel: VoteCardModel;
  reasonControl = new FormControl('', Validators.required);

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private voteFacade: VoteFacade) {
    super(modalRef, platform);
  }

  archiveVote() {
    this.voteFacade.archiveVote(this.voteModel, this.reasonControl.value);
    this.dismiss();
  }

}
