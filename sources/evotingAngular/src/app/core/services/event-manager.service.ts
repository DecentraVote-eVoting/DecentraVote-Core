/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {OrganizationContractService} from '@core/services/organization-contract.service';
import {filter, first, map, switchMap, take, tap} from 'rxjs/operators';
import {Contract, Event} from 'ethers';
import contractAbi
  from '../../../../../solidity/target/generated/abi/com.iteratec.evoting.solidity.contracts/EventManager.json';
import {VoteSelectorsService} from '@voting/services/vote-selectors.service';
import {VoteModel} from '@voting/models/vote.model';
import * as voteActions from '@voting/+state/vote.actions';
import * as meetingActions from '@meeting/+state/meeting.actions';
import {Store} from '@ngrx/store';
import * as memberAction from '@app/user/+state/user.actions';
import * as importUserAction from '@import-user/+state/import-user.actions';
import {UserFacade} from '@user/services/user.facade';
import {Role} from '@user/models/role.model';


@Injectable({
  providedIn: 'root'
})
export class EventManagerService {

  constructor(private organizationContractService: OrganizationContractService,
              private selectors: VoteSelectorsService,
              private store: Store<any>,
              private userFacade: UserFacade
  ) {
  }

  address: string;

  subscribeToEventManager() {
    this.organizationContractService.getContractIfReady().pipe(
      take(1),
      switchMap((contract: Contract) => {
        return this.organizationContractService.eventManager().pipe(
          tap((eventManagerAddress) => {
            this.address = eventManagerAddress;
            new Contract(this.address, contractAbi, contract.provider)
              .on({}, (event) => this.checkPermissionAndPerform(() => this.manageEvent(event)));
          })
        );
      })
    ).subscribe();
  }

  checkPermissionAndPerform(callback: Function) {
    this.userFacade.getMyRoleFromStoreOrContract().pipe(
      map((role: Role) => {
        return role.value > Role.NONE.value;
      }),
      first(),
      filter(value => value === true),
      tap(() => {
          callback();
        }
      )
    ).subscribe();
  }

  private manageEvent(event: Event) {
    switch (event.event) {
      case 'AnonAccountRegistered':
        this.selectors.getAllVoteModels().pipe(
          first(),
          tap((votes: VoteModel[]) => {
            votes
              .filter(vote =>
                vote.root.toHexString() === event.args.root.toHexString() &&
                vote.index.toHexString() === event.args.index.toHexString()
              )
              .forEach(voteRaw => this.store.dispatch(voteActions.GetVoteDetailAction({voteAddress: voteRaw.address})));
          })
        ).subscribe();
        break;
      case 'ChangedVote':
        this.store.dispatch(voteActions.GetVoteDetailAction({voteAddress: event.args.voteAddress}));
        break;
      case 'ChangedMeeting':
        this.store.dispatch(meetingActions.GetMeetingDetailAction({address: event.args.meetingAddress}));
        break;
      case 'RemoveMeeting':
        this.store.dispatch(meetingActions.DeleteMeetingEvent({meetingAddress: event.args.meetingAddress}));
        break;
      case 'NewResolutionDeployed':
        this.store.dispatch(voteActions.GetVoteDetailAction({voteAddress: event.args.entityAddress}));
        break;
      case 'ResolutionRemoved':
        this.store.dispatch(voteActions.DeleteVoteEvent({
          meetingAddress: event.args.meetingAddress,
          voteAddress: event.args.voteAddress
        }));
        break;
      case 'UserClaim':
        this.store.dispatch(memberAction.GetUserDetailAction({
          userAddress: event.args.user,
          claimHash: event.args.claimHash,
          roleNumber: event.args.role
        }));
        this.store.dispatch(importUserAction.LoadImportedUsersAction());
        break;
      case 'MemberRemoved':
        this.store.dispatch(memberAction.RemoveUserSuccessAction({address: event.args.member}));
        break;
      case 'NewGeneralMeetingDeployed':
        this.store.dispatch(meetingActions.GetMeetingDetailAction({address: event.args.entityAddress}));
        break;
      case 'VoteClosed':
        break;
      case 'UserEdited':
        this.store.dispatch(memberAction.EditUserSuccessAction());
        this.store.dispatch(memberAction.GetUserDetailAction({
          userAddress: event.args.user,
          claimHash: event.args.claimHash,
          roleNumber: event.args.role
        }));
        break;
      case 'TreeHashCommitted':
        this.store.dispatch(voteActions.ProcessingVotesSuccessAction({voteAddress: event.args.voteAddress}));
        break;
      case 'Log':
        console.log('LOG EVENT received: ' + event.args.logMessage);
        break;
      default:
        console.warn('Unknown Event found: ');
        console.warn(event);
    }
  }
}
