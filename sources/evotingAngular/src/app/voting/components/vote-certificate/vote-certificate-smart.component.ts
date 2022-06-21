import {Component, OnDestroy, OnInit} from '@angular/core';
import {combineLatest, Observable, of, ReplaySubject, Subject, throwError, zip} from 'rxjs';
import {SessionStorageUtil} from '@core/utils/session-storage.util';
import {catchError, first, map, mergeMap, takeUntil} from 'rxjs/operators';
import {EthersService} from '@core/services/ethers.service';
import {ActivatedRoute} from '@angular/router';
import {Store} from '@ngrx/store';
import {State} from '@app/app.store';
import {VoteFacade} from '@voting/services/vote.facade';
import {VoteDetailModel} from '@voting/models/vote.model';
import {VoteCertificate} from '@core/models/signature.model';
import {MeetingDetailModel} from '@meeting/models/meeting.model';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {VoteService} from '@voting/services/vote.service';
import * as meetingActions from '@meeting/+state/meeting.actions';
import * as voteActions from '@voting/+state/vote.actions';
import {User} from '@user/models/user.model';
import {UserFacade} from '@user/services/user.facade';
import {Ballot} from '@core/models/ballot-box.model';

@Component({
  selector: 'app-vote-certificate-smart',
  template: `
    <app-vote-certificate
      [meetingDetailModel]="meetingDetailModel"
      [voteDetailModel]="voteDetailModel"
      [certificates]="certificates"
      [owner]="owner"
      [templateReady$]="templateReady$ | async"
      [certificatesReady$]="certificatesReady$ | async"
      [ownerResolved$]="ownerResolved$ | async"

      (closeWindowAction)="closeWindow()">
    </app-vote-certificate>
  `
})
export class VoteCertificateSmartComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject();
  private paramObservable$: Observable<[string, string]>;

  meetingDetailModel: MeetingDetailModel;
  voteDetailModel: VoteDetailModel;
  certificates: VoteCertificate[];
  owner: User[];

  voteCardModelReady$ = new ReplaySubject(1);
  certificatesFound$ = new ReplaySubject(1);
  ownerReady$ = new ReplaySubject(1);

  templateReady$: Observable<boolean> = this.voteCardModelReady$.pipe(map(() => true));
  certificatesReady$: Observable<boolean> = this.certificatesFound$.pipe(map(() => true));
  ownerResolved$: Observable<boolean> = this.ownerReady$.pipe(map(() => true));

  constructor(private ethersService: EthersService,
              private route: ActivatedRoute,
              private store: Store<State>,
              private voteFacade: VoteFacade,
              private meetingFacade: MeetingFacade,
              private voteService: VoteService,
              private userFacade: UserFacade
  ) {
  }

  ngOnInit() {
    this.ethersService.createSigner(SessionStorageUtil.getMnemonic());

    this.paramObservable$ = this.route.params.pipe(
      first(),
      map(params => {
        this.store.dispatch(meetingActions.GetMeetingDetailAction({address: params['meetingAddress']}));
        this.store.dispatch(voteActions.GetVoteDetailAction({voteAddress: params['voteAddress']}));
        return [params['meetingAddress'], params['voteAddress']];
      })
    );

    // Meeting & Vote Model
    this.paramObservable$.pipe(
      takeUntil(this.unsubscribe$),
      mergeMap(([meetingAddress, voteAddress]) => {
        return combineLatest([
          this.meetingFacade.getMeetingDetailModel(meetingAddress),
          this.voteFacade.getVoteDetailModelByAddress(voteAddress)
        ]);
      })
    ).subscribe(([meeting, vote]: [MeetingDetailModel, VoteDetailModel]) => {
      this.meetingDetailModel = meeting;
      this.voteDetailModel = vote;
      this.voteCardModelReady$.next();
    });

    // Certificates
    this.voteCardModelReady$.pipe(
      takeUntil(this.unsubscribe$),
      mergeMap(() => {
        if (this.voteDetailModel.isAnonymous) {
          return of(this.voteService.getVerifiedVoteCertificates(
            this.voteDetailModel.anonymousAccountsRegistered, this.voteDetailModel.address
          ));
        }
        return this.ethersService.getSignerAddress().pipe(
          takeUntil(this.unsubscribe$),
          map((signerAddress: string) => {
            return this.voteService.getVerifiedVoteCertificates([signerAddress], this.voteDetailModel.address);
          })
        );
      }),
      mergeMap((certs: VoteCertificate[]) => {
        const ballots: Ballot[] = certs
          .map(cert => JSON.parse(cert.certificate.message))
          .map(ballot => JSON.parse(ballot.signedDecision.decision));
        return this.voteService.resolveVoteDecisionsFromCertificates(
          this.voteDetailModel.address,
          ballots,
          this.voteDetailModel.voteOptions.length)
          .pipe(
            map(decisions => {
              ballots.forEach((ballot, index) => {
                certs[index].resolvedVoteOption = this.voteDetailModel.voteOptions[decisions[index]].value;
              });
              return certs;
            })
          );
      }),
      catchError(_ => throwError('No certificates found'))
    ).subscribe((certs: VoteCertificate[]) => {
      this.certificates = certs;
      this.certificatesFound$.next();
    });

    this.certificatesReady$.pipe(
      takeUntil(this.unsubscribe$),
      mergeMap(() => {
        return zip(...this.certificates.map(cert => cert.ballotBox.owner).map(address => this.userFacade.getUserByAddress(address)));
      })
    ).subscribe((owner: User[]) => {
      this.owner = owner;
      this.ownerReady$.next();
    });
  }

  closeWindow() {
    this.ngOnDestroy();
    window.close();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
