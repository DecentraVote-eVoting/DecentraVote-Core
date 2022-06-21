/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {AfterViewInit, Component, EventEmitter, HostListener, OnDestroy, OnInit, Output} from '@angular/core';
import {combineLatest, EMPTY, Observable, of, ReplaySubject, Subject, zip} from 'rxjs';
import {StorageVotingOption} from '@core/models/storage.model';
import {VerifiableBallot} from '@voting/models/ballot-box.model';
import {VoteFacade} from '@voting/services/vote.facade';
import {StorageService} from '@core/services/storage.service';
import {ActivatedRoute} from '@angular/router';
import {BallotBoxService} from '@core/services/ballot-box.service';
import {Store} from '@ngrx/store';
import {State} from '@app/app.store';
import {catchError, concatMap, filter, first, map, switchMap, tap} from 'rxjs/operators';
import * as voteActions from '@voting/+state/vote.actions';
import {EthersService} from '@core/services/ethers.service';
import {SessionStorageUtil} from '@core/utils/session-storage.util';
import {BigNumber} from 'ethers';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {GetMeetingAddressesAction} from '@meeting/+state/meeting.actions';
import {ZkProofService} from '@core/services/zk-proof.service';
import {VoteResult} from '@voting/models/vote.model';
import {VoteSelectorsService} from '@voting/services/vote-selectors.service';
import {VoteService} from '@voting/services/vote.service';
import {CryptoFacade} from '@core/services/crypto.facade';
import {MeetingContractService} from '@meeting/services/meeting-contract.service';
import {UserFacade} from '@user/services/user.facade';
import {ResolvedClaim, User} from '@user/models/user.model';
import {LoadUsersAction} from '@user/+state/user.actions';
import {CheckedBallot, VoteVerificationService} from '@voting/services/vote-verification.service';

interface InvalidUserWithOption {
  option: string;
  userClaim: ResolvedClaim;
}

@Component({
  providers: [VoteVerificationService],
  selector: 'app-vote-verification-smart',
  template: `
    <app-vote-verification [title]="title"
                           [verifyProofSupported]="verifyProofSupported"
                           [validBallotCount]="validBallots.length"
                           [invalidBallotCount]="invalidBallots.length"
                           [isAnonymous]="isAnonymous"
                           [percentage]="percentage"
                           [options]="optionsEvent$ | async"
                           [ballotCount]="ballotCount"
                           [validResult]="validResults"
                           [invalidResult]="invalidResults"
                           [updateDetailEvent$]="updateDetailEvent$"
                           (closeWindowAction)="closeWindow()">
    </app-vote-verification>
  `
})
export class VoteVerificationSmartComponent implements OnInit, AfterViewInit, OnDestroy {
  private unsubscribe$ = new Subject();
  private paramObservable$: Observable<[string, string]>;
  optionsEvent$: ReplaySubject<StorageVotingOption[]> = new ReplaySubject(1);
  private resultEvent$: Subject<CheckedBallot> = new Subject();
  updateDetailEvent$: Subject<InvalidUserWithOption> = new Subject<InvalidUserWithOption>();

  validResults: VoteResult[] = [];
  invalidResults: VoteResult[] = [];
  isAnonymous: boolean;
  title = '';
  percentage = 0;

  verifyProofSupported = true;

  ballotCount = 0;
  validBallots: VerifiableBallot[] = [];
  invalidBallots: VerifiableBallot[] = [];
  invalidUserWithOptionCount = 0;

  chairmenPrivateKey: BigNumber = BigNumber.from(0);

  @Output() closeWindowAction = new EventEmitter();

  constructor(private voteFacade: VoteFacade,
              private storageService: StorageService,
              private route: ActivatedRoute,
              private ballotBoxService: BallotBoxService,
              private ethersService: EthersService,
              private store: Store<State>,
              private meetingFacade: MeetingFacade,
              private zkProofService: ZkProofService,
              private voteSelectors: VoteSelectorsService,
              private voteService: VoteService,
              private cryptoFacade: CryptoFacade,
              private meetingContractService: MeetingContractService,
              private userFacade: UserFacade,
              private voteVerificationService: VoteVerificationService
  ) {
  }

  @HostListener('window:unload', ['$event'])
  unloadHandler() {
    this.ngOnDestroy();
  }

  closeWindow() {
    this.ngOnDestroy();
    window.close();
  }

  ngOnInit() {
    // Need to create signer because new tab is not logged in
    this.ethersService.createSigner(SessionStorageUtil.getMnemonic());
    this.paramObservable$ = this.route.params.pipe(
      first(),
      map(params => [params['meetingAddress'], params['voteAddress']])
    );

    // Dispatching Setup Actions
    this.paramObservable$.subscribe(([, voteAddress]) => {
      this.store.dispatch(
        voteActions.GetVoteDetailAction({voteAddress})
      );
      this.store.dispatch(GetMeetingAddressesAction());
      this.store.dispatch(LoadUsersAction());
    });

    // Setting Vote Options
    this.paramObservable$.pipe(
      switchMap(([, voteAddress]) => this.voteFacade.getVoteOptions(voteAddress)),
      first()
    ).subscribe(this.optionsEvent$);

    this.optionsEvent$.subscribe(options => {
      this.validResults = options.map(option => ({name: option.value, value: 0}));
      this.invalidResults = options.map(option => ({name: option.value, value: 0}));
    });

    // Setting Title
    this.paramObservable$.pipe(
      switchMap(([, voteAddress]) => this.voteFacade.getVoteCardModelByAddress(voteAddress))
    ).subscribe(vote => this.title = vote.title);

    // Setting Chairman Key
    this.paramObservable$.pipe(
      switchMap(([, voteAddress]) => this.voteSelectors.getChairmanPrivateKey(voteAddress))
    ).subscribe((chairmanPrivateKey) => this.chairmenPrivateKey = chairmanPrivateKey);

    this.paramObservable$.subscribe(([meetingAddress, voteAddress]) =>
      this.voteVerificationService.prepareVerification(meetingAddress, voteAddress));

    this.resultEvent$.pipe(
      concatMap((ballot: CheckedBallot) => {
        const invalidUsers$ = this.isAnonymous || ballot.valid ? of(undefined) :
          this.userFacade.getUserByAddress(ballot.ballot.signerAddress);
        return combineLatest([
          invalidUsers$,
          this.optionsEvent$
        ]).pipe(
            first(),
            map(([invalidUser, options]: [User, StorageVotingOption[]]) => [ballot, options, invalidUser])
          );
      })
    ).subscribe(([checkedBallot, options, invalidUser]: [CheckedBallot, StorageVotingOption[], User]) => {
      this.updateResult(checkedBallot, options, invalidUser);
    });
  }

  ngAfterViewInit() {
    this.paramObservable$.pipe(
      switchMap(([_, voteAddress]) => zip(
        this.voteFacade.getVerifiableBallotsByVoteAddress(voteAddress)
          .pipe(
            filter(ballots => ballots.length >= 1),
          ),
        this.voteFacade.getIsAnonymousByVoteAddress(voteAddress),
        of(voteAddress))
      ),
      first(),
      switchMap(([ballots, isAnonymous, voteAddress]) => {
        this.ballotCount = ballots.length;
        this.isAnonymous = isAnonymous;

        return isAnonymous ? this.voteVerificationService.anonymousVerification(ballots, voteAddress) :
          this.voteVerificationService.openVerification(ballots);
      }),
      tap((checkedBallot: CheckedBallot) => {
        (checkedBallot.valid ? this.validBallots : this.invalidBallots).push(checkedBallot.ballot);
        const doneCount = this.validBallots.length + this.invalidBallots.length;
        this.percentage = Math.min(Math.floor(doneCount / this.ballotCount * 100), 100);
      }),
      catchError((err) => {
        console.log(err)
        this.verifyProofSupported = false;
        return EMPTY;
      })
    ).subscribe(this.resultEvent$);
  }

  updateResult(checkedBallot: CheckedBallot, options: StorageVotingOption[], invalidUser?: User) {
    if (BigInt(this.chairmenPrivateKey) === BigInt(0)) {
      return;
    }
    const selectedOptionNumber = this.cryptoFacade.countVote(
      [checkedBallot.ballot.ballot],
      this.chairmenPrivateKey._hex,
      options.length)[0];
    const selectedOption = options[selectedOptionNumber];

    if (invalidUser) {
      this.updateDetailEvent$.next(<InvalidUserWithOption>{
        option: selectedOption.value,
        userClaim: invalidUser.resolvedClaim
      });
      this.invalidUserWithOptionCount++;
      if (this.invalidUserWithOptionCount === this.invalidBallots.length) {
        this.updateDetailEvent$.complete();
      }
    }

    if (checkedBallot.valid) {
      this.validResults = this.validResults.map(result => {
        const newResult = result;
        if (newResult.name === selectedOption.value) {
          newResult.value++;
        }
        return newResult;
      });
    } else {
      this.invalidResults = this.invalidResults.map(result => {
        const newResult = result;
        if (newResult.name === selectedOption.value) {
          newResult.value++;
        }
        return newResult;
      });
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
