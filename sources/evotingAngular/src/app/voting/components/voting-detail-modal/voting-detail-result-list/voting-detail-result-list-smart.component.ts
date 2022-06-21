/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {map, takeUntil} from 'rxjs/operators';
import {VoteFacade} from '@voting/services/vote.facade';
import {ExportVoteResult, UserResult, VoteDetailModel} from '@voting/models/vote.model';
import {combineLatest, Subject} from 'rxjs';
import {MatAccordion} from '@angular/material/expansion';
import {DomSanitizer} from '@angular/platform-browser';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {FileUtil} from '@core/utils/file.util';
import {TransformUtil} from '@core/utils/transform.util';
import {VoteSelectorsService} from '@voting/services/vote-selectors.service';

@Component({
  selector: 'app-voting-detail-result-list-smart',
  template: `
    <app-voting-detail-result-list [vote]="vote"
                                   [showButton]="showDownloadResultButton()"
                                   [disableButton]="disableButton"
                                   [resultsByOption]="resultsByOption"
                                   [resultsByUser]="resultsByUser"
                                   (exportButtonClick)="this.onExportButtonClick()">
    </app-voting-detail-result-list>`
})
export class VotingDetailResultListSmartComponent implements OnInit, OnDestroy {

  @Input() vote: VoteDetailModel;

  @ViewChild(MatAccordion) accordion: MatAccordion;
  @ViewChild('exportButton') exportButton: ElementRef;

  private unsubscribe$ = new Subject();

  voteStage = VoteStage;
  disableButton = false;
  membersVoteResult: ExportVoteResult;
  resultsByUser: { [key: string]: { result: UserResult, expanded: boolean } };
  resultsByOption: { [key: string]: { results: UserResult[], expanded: boolean} };

  constructor(private voteFacade: VoteFacade,
              private sanitizer: DomSanitizer,
              private selectors: VoteSelectorsService,
  ) {
  }

  ngOnInit(): void {
    combineLatest([
        this.voteFacade.getResultsByVoteDecisionAddress(this.vote.address),
        this.selectors.getAttachmentHash(this.vote.address),
      ]
    ).pipe(
        takeUntil(this.unsubscribe$),
        map(([userResults, attachmentHash]: [UserResult[], string]) => {
          this.membersVoteResult = <ExportVoteResult>{
            title: this.vote.title,
            description: this.vote.description,
            attachmentFileName: this.vote.filename,
            attachmentHash: this.vote.filename ? attachmentHash : '',
            options: TransformUtil.transformStorageVotingOptionArrayToStringArray(this.vote.voteOptions),
            userResults
          };
          return userResults;
        }),
        map((results: UserResult[]) => {
          const resultsByUser = {};
          const resultsByOption = {};
          this.vote.voteOptions.forEach(option => resultsByOption[option.value] = {results: [], expanded: false});

          results.forEach(result => {
            resultsByUser[result.ethAddress] = {result: result, expanded: false};
            result.options.forEach(option => {
              if (resultsByOption[option].results.indexOf(result) === -1) {  // only push unique results
                resultsByOption[option].results.push(result);
              }
            });
          });
          this.resultsByUser = resultsByUser;
          this.resultsByOption = resultsByOption;
        })
      ).subscribe();
  }

  onExportButtonClick() {
    this.disableButton = true;
    const data = JSON.stringify(this.membersVoteResult, null, 2)
      .split('options').join('votes');
    FileUtil.downloadStringEncodedFile(data, '.json', this.sanitizer);

    this.disableButton = false;
  }

  showDownloadResultButton(): boolean {
    return this.vote.stage === this.voteStage.COUNTED && !this.vote.isAnonymous;
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
