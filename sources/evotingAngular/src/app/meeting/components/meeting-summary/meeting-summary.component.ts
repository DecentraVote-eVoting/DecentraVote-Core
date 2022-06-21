/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MeetingDetailModel} from '@meeting/models/meeting.model';
import {MemberRepresentation} from '@meeting/models/meeting-member.model';
import {AssetFiles} from '@core/models/asset.model';
import {zoomLevel} from 'zoom-level';
import {User} from '@user/models/user.model';
import {UserSortPipe} from '@core/pipes/user-sort.pipe';


@Component({
  selector: 'app-meeting-summary',
  templateUrl: './meeting-summary.component.html'
})
export class MeetingSummaryComponent implements OnInit {
  @Input() meeting: MeetingDetailModel;
  @Input()
  set representations(representations: MemberRepresentation[]) {
    if (!representations) { return; }
    this.representationsSplit = this.getSplitLists(representations);
  }
  @Input()
  set memberWithVoteRights(users: User[]) {
    if (!users) { return; }
    users = this.userSortPipe.transform(users, 0);
    this.memberWithVoteRightsSplit = this.getSplitLists(users);
  }
  @Input() countedVoteAddresses: { voteAddress: string, isAnonymous: boolean }[];
  @Input() templateReady = false;
  @Output() voteDataReady = new EventEmitter<any>();

  assetFiles = AssetFiles;
  memberWithVoteRightsSplit: User[][] = [];
  nColumns = 3;
  nColumnsMembers = 3;

  representationsSplit: MemberRepresentation[][] = [];

  constructor(private userSortPipe: UserSortPipe) {
  }

  ngOnInit() {
    /*
    the following code prepares css variables for correct scaling of html content, as to imitate the look
    of an A4 page. the "fake" A4-like page does not scale after its initial creation (but statically
    increased/decreases in size when zooming) and is affected by zoom level during its creation.
    its width is based on a percentage of the current inner window width and its min-height corresponds to
    what the A4 ratio dictates. content (e.g. font size) needs to be scaled according to zoom level and deviations from
    an ideal width, at which font-sizes look almost identical to what would be viewed in the print preview
    NOTE: conversions from mm/pt to px do not work reliably on different monitors, which is why the fake A4 page is
    not set to real measurements. only their ratios are preserved.
    */

    // width at which font sizes (measured in pt) deviate the least (ratio-wise) compared to A4 size
    const idealWidth = 1286;
    // cover 80% of window width, height is calculated in css based on width
    const pageWidthScale = 0.8;
    const pageWidth = window.innerWidth * pageWidthScale * zoomLevel();

    const adjustFontSizeForWidth = window.innerWidth / idealWidth;
    const adjustFontSize = adjustFontSizeForWidth * zoomLevel();

    document.documentElement.style.setProperty('--adjustFontSize', adjustFontSize.toString());
    document.documentElement.style.setProperty('--pageWidth', pageWidth.toString() + 'px');
  }

  getSplitLists(list: any[], nSplits: number = this.nColumns): any[][] {
    const splitLists: any[][] = [];
    list.forEach((item, index) => {
      (splitLists[index % nSplits] = splitLists[index % nSplits] || []).push(item);
    });
    return splitLists;
  }
}
