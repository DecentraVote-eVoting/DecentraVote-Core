/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {MeetingStage} from '../../models/meeting.model';
import {ModalService} from '@core/services/modal.service';
import {CreateMeetingModalComponent} from '../create-meeting-modal/create-meeting-modal.component';
import {PermissionService} from '@core/services/permission.service';
import {Permission} from '@core/models/permission.model';
import {AssetFiles} from '@core/models/asset.model';
import {ROUTE_PATHS} from '@app/route-paths';
import {Router} from '@angular/router';
import {SessionStorageUtil} from '@core/utils/session-storage.util';
import {CryptoFacade} from '@core/services/crypto.facade';
import {ShowMnemonicModalComponent} from '@core/components/show-mnemonic-modal/show-mnemonic-modal.component';
import {MeetingModel} from '@meeting/models/meeting.model';
import {DomSanitizer} from '@angular/platform-browser';
import {User} from '@user/models/user.model';
import {EnvironmentService} from '@core/services/environment.service';
import {Role} from '@user/models/role.model';
import {COOKIE_ACCESS, COOKIE_REFRESH} from '@core/models/common.model';
import {CookieService} from 'ngx-cookie-service';

@Component({
  selector: 'app-meeting-overview',
  templateUrl: './meeting-overview.component.html'
})
export class MeetingOverviewComponent {

  @Input() meetings: MeetingModel[] = [];
  @Input() isMeetingsLoading = false;
  @Input() userIsDirector: boolean;
  @Input() user: User;

  meetingStage = MeetingStage;
  assetFiles = AssetFiles;
  routePaths = ROUTE_PATHS;

  constructor(private modalService: ModalService,
              private permissionService: PermissionService,
              private router: Router,
              private cryptoFacade: CryptoFacade,
              private sanitizer: DomSanitizer,
              private env: EnvironmentService,
              private cookieService: CookieService) {
  }
  getSanitizerUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  getYears() {
    return (this.meetings || [])
      .filter(m => m && m.startDate)
      .map(m => m.startDate.getFullYear())
      .filter(
        (v, i, self) => {
          return i === self.indexOf(v);
        })
      .sort((a, b) => b - a);
  }

  getSortedMeetingsByYear(year: number) {
    return this.meetings
      .filter( meeting =>
      (this.permissionService.check(Permission.SHOW_MEETING, meeting)) && meeting.startDate.getFullYear() === year)
      .sort( (meeting_a, meeting_b) =>
        meeting_b.endDate.getTime() - meeting_a.startDate.getTime());
  }

  getOrganizationAddress(): string {
    return this.env.getOrganizationAddress();
  }

  openCreateMeetingModal() {
    this.modalService.openModal<CreateMeetingModalComponent>(CreateMeetingModalComponent, {close: true});
  }

  showMeetingCreate(): boolean {
    return this.permissionService.check(Permission.MEETING_CREATE);
  }

  showUsersButton() {
    if (!this.user) { return false; }   // GUARD
    return this.isUserMember(this.user) || this.isUserDirector(this.user);
  }

  showMemberManage() {
    return this.permissionService.check(Permission.USER_MANAGE);
  }

  isMeetingsEmpty(): boolean {
    return (this.meetings || []).filter( meeting => (this.permissionService.check(Permission.SHOW_MEETING, meeting))).length === 0;
  }

  showMnemonic() {
    this.modalService.openModal<ShowMnemonicModalComponent>(ShowMnemonicModalComponent, {close: true});
  }

  showHelp() {
    window.open('https://decentra.vote/#documentation', '_blank').focus();
  }

  isUserDirector(user: User): boolean {
    return user.role.isRole(Role.DIRECTOR);
  }

  isUserMember(user: User): boolean {
    return user.role.isRole(Role.MEMBER);
  }

  isUserGuest(user: User): boolean {
    return user.role.isRole(Role.GUEST);
  }

  logout() {
    SessionStorageUtil.removeMnemonic();
    SessionStorageUtil.removeEncryptedMnemonic();
    SessionStorageUtil.removeHashedPassword();
    this.cryptoFacade.resetSecret();
    this.cookieService.delete(COOKIE_ACCESS, '/');
    this.cookieService.delete(COOKIE_REFRESH, '/');
    this.cookieService.delete(COOKIE_ACCESS, '/app');
    this.cookieService.delete(COOKIE_REFRESH, '/app');
    window.location.reload();
  }
}
