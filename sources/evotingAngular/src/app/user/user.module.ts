/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CoreModule} from '@core/core.module';
import {TranslateModule, TranslatePipe} from '@ngx-translate/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {UserOverviewComponent} from './/components/user-overview/user-overview.component';
import {UserRoutingModule} from './/user-routing.module';
import {UserHeaderComponent} from './/components/user-header/user-header.component';
import {UserManageComponent} from './/components/user-manage/user-manage.component';
import {UserManageSmartComponent} from './/components/user-manage/user-manage-smart.component';
import {UserOverviewSmartComponent} from './/components/user-overview/user-overview-smart.component';
import {EffectsModule} from '@ngrx/effects';
import {UserEffects} from './/+state/user.effects';
import {RemoveUserModalComponent} from './/components/remove-user-modal/remove-user-modal.component';
import {MeetingModule} from '@meeting/meeting.module';
import {ImportUserModule} from '@import-user/import-user.module';
import {UserManageListComponent} from './components/user-manage-list/user-manage-list.component';
import {UserManageImportListComponent} from './components/user-manage-import-list/user-manage-import-list.component';
import {ImportUserEffects} from '@import-user/+state/import-user.effects';
import {ExportUsersModalSmartComponent} from '@import-user/components/export-users-modal-smart/export-users-modal-smart.component';
import {ExportUsersModalComponent} from '@import-user/components/export-users-modal-smart/export-users-modal.component';
import {ImportUsersModalSmartComponent} from '@import-user/components/import-users-modal-smart/import-users-modal-smart.component';
import {ImportUsersModalComponent} from '@import-user/components/import-users-modal-smart/import-users-modal.component';
import {UserFormComponent} from '@import-user/components/user-form/user-form.component';
import {ReplaceUserModalComponent} from './components/replace-user-modal/replace-user-modal.component';
import {ReplaceUserModalSmartComponent} from '@user/components/replace-user-modal/replace-user-modal-smart.component';
import {MatExpansionModule} from '@angular/material/expansion';
import { UserEditModalComponent } from './components/user-edit-modal/user-edit-modal.component';
import {MatMenuModule} from '@angular/material/menu';
import {ClipboardModule} from '@angular/cdk/clipboard';

const COMPONENTS = [
  UserOverviewComponent,
  UserOverviewSmartComponent,
  UserHeaderComponent,
  UserManageComponent,
  UserManageListComponent,
  UserManageSmartComponent,
  UserManageImportListComponent,
  ExportUsersModalComponent,
  ReplaceUserModalComponent,
  ReplaceUserModalSmartComponent,
  UserFormComponent
];

const MODAL_COMPONENTS = [
  RemoveUserModalComponent,
  ExportUsersModalSmartComponent,
  ExportUsersModalSmartComponent,
  ExportUsersModalComponent,
  ReplaceUserModalComponent,
  ReplaceUserModalSmartComponent,
  ImportUsersModalSmartComponent,
  ImportUsersModalComponent
];

@NgModule({
  declarations: [COMPONENTS, MODAL_COMPONENTS, UserEditModalComponent],
  entryComponents: [MODAL_COMPONENTS],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        NgbModule,
        UserRoutingModule,
        CoreModule,
        MeetingModule,
        ImportUserModule,
        TranslateModule,
        EffectsModule.forFeature([UserEffects, ImportUserEffects]),
        MatExpansionModule,
        MatMenuModule,
        ClipboardModule,
    ],
  providers: [TranslatePipe],
  exports: [COMPONENTS, MODAL_COMPONENTS],
})
export class UserModule {
}
