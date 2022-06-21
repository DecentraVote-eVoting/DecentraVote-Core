import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {VoteDetailModel} from '@voting/models/vote.model';
import {VoteCertificate} from '@core/models/signature.model';
import {zoomLevel} from 'zoom-level';
import {AssetFiles} from '@core/models/asset.model';
import {MeetingDetailModel} from '@meeting/models/meeting.model';
import {User} from '@user/models/user.model';

@Component({
  selector: 'app-vote-certificate',
  templateUrl: './vote-certificate.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoteCertificateComponent implements OnInit {
  @Input() meetingDetailModel: MeetingDetailModel;
  @Input() voteDetailModel: VoteDetailModel;
  @Input() certificates: VoteCertificate[];
  @Input() owner: User[];
  @Input() templateReady$ = false;
  @Input() certificatesReady$ = false;
  @Input() ownerResolved$ = false;

  @Output() closeWindowAction = new EventEmitter();

  assetFiles = AssetFiles;
  constructor() { }

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

}
