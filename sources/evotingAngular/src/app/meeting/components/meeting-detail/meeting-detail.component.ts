/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {MembershipService} from '@core/services/membership.service';
import {Observable} from 'rxjs';
import {MeetingDetailModel, MeetingTab} from '@meeting/models/meeting.model';
import {UserFacade} from '@app/user/services/user.facade';
import {User} from '@app/user/models/user.model';
import {first, map, switchMap} from 'rxjs/operators';
import {EthersService} from '@core/services/ethers.service';
import {Role} from '@user/models/role.model';

@Component({
  selector: 'app-meeting',
  templateUrl: './meeting-detail.component.html'
})
export class MeetingDetailComponent {

  @Input() userIsDirector: boolean;

  @Input()
  set meeting(meeting: MeetingDetailModel) {
    if (meeting) {
      this._meeting = meeting;

      this.userRole$ = this.ethersService.getSignerAddress()
        .pipe(first(),
          switchMap((address: string) => {
            return this.userFacade.getUserByAddress(address);
          }),
          map((user: User) => user.role));

      this.userIsChairperson = this.membershipService.isChairperson(meeting);
      this.chairperson$ = this.memberFacade.getUserByAddress(meeting.chairperson);
    }
  }

  get meeting(): MeetingDetailModel {
    return this._meeting;
  }

  activeTab: MeetingTab = MeetingTab.VOTING;
  meetingTab = MeetingTab;
  chairperson$: Observable<User>;
  userIsChairperson = false;
  _meeting: MeetingDetailModel;
  memberAddress: string;
  userRole$: Observable<Role>;

  constructor(private membershipService: MembershipService,
              private memberFacade: UserFacade,
              private ethersService: EthersService,
              private userFacade: UserFacade) {}

  onTabChange(tab: MeetingTab) {
    this.activeTab = tab;
  }

}
