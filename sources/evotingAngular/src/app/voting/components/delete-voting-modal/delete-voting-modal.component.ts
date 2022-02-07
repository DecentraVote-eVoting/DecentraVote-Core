/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {VoteFacade} from '@voting/services/vote.facade';
import {VoteCardModel} from '@voting/models/vote.model';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {PlatformLocation} from '@angular/common';

@Component({
  selector: 'app-delete-voting-modal',
  templateUrl: './delete-voting-modal.component.html',
})
export class DeleteVotingModalComponent extends AbstractModalComponent {

  @Input() voteModel: VoteCardModel;


  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private voteFacade: VoteFacade) {
    super(modalRef, platform);
  }



  deleteVote() {
    this.voteFacade.deleteVote(this.voteModel);
    this.dismiss();
  }


}
