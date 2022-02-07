/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {Permission} from '@core/models/permission.model';
import {PermissionService} from '@core/services/permission.service';
import {FileUtil} from '@core/utils/file.util';
import {VoteDetailModel} from '@voting/models/vote.model';
import {MeetingDetailModel} from '@meeting/models/meeting.model';

@Component({
  selector: 'app-voting-detail-main-content',
  templateUrl: './voting-detail-main-content.component.html'
})
export class VotingDetailMainContentComponent {

  @Input() vote: VoteDetailModel;
  @Input() meeting: MeetingDetailModel;

  stages = VoteStage;

  constructor(private permissionService: PermissionService) {
  }

  showVotingIcon(): boolean {
    return this.permissionService.check(Permission.VOTING_SHOW_ICON, this.meeting, this.vote)
      && this.vote.numberOfOwnVoteRights > 0
      && this.vote.numberOfOwnVoteRights - this.vote.numberOfOwnVotesCast === 0;
  }

  downloadAttachment() {
    FileUtil.downloadFile(this.vote.attachment, this.vote.filename);
  }

}
