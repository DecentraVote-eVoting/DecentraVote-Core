/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
export interface SpinnerInfo {
  description?: string;
}

export class Spinner {
  static readonly REMOVE_MEMBER: SpinnerInfo = {description: 'Message.Spinner.Remove-Member'};
  static readonly EDIT_MEMBER: SpinnerInfo = {description: 'Message.Spinner.Edit-Member'};
  static readonly EDIT_IMPORT_USER: SpinnerInfo = {description: 'Message.Spinner.Edit-Import-User'};
  static readonly JOIN_MEETING: SpinnerInfo = {description: 'Message.Spinner.Join-Meeting'};
  static readonly LOAD_MEETINGS: SpinnerInfo = {description: 'Message.Spinner.Load-Meetings'};
  static readonly LOAD_MEETING_DETAILS: SpinnerInfo = {description: 'Message.Spinner.Load-Meeting'};
  static readonly CREATE_MEETING: SpinnerInfo = {description: 'Message.Spinner.Create-Meeting'};
  static readonly EDIT_MEETING: SpinnerInfo = {description: 'Message.Spinner.Update-Meeting'};
  static readonly DELETE_MEETING: SpinnerInfo = {description: 'Message.Spinner.Delete-Meeting'};
  static readonly OPEN_REGISTRATION: SpinnerInfo = {description: 'Message.Spinner.Open-Registration'};
  static readonly OPEN_MEETING: SpinnerInfo = {description: 'Message.Spinner.Open-Meeting'};
  static readonly CLOSE_MEETING: SpinnerInfo = {description: 'Message.Spinner.Close-Meeting'};
  static readonly CLOSE_REGISTER: SpinnerInfo = {description: 'Message.Spinner.Close-Registration'};
  static readonly LOAD_VOTINGS: SpinnerInfo = {description: 'Message.Spinner.Load-Votings'};
  static readonly LOAD_VOTING_DETAILS: SpinnerInfo = {description: 'Message.Spinner.Load-Voting'};
  static readonly CREATE_VOTING: SpinnerInfo = {description: 'Message.Spinner.Create-Voting'};
  static readonly SORT_VOTING: SpinnerInfo = {description: 'Message.Spinner.Sort-Voting'};
  static readonly CHANGE_STATUS: SpinnerInfo = {description: 'Message.Spinner.Update-Voting'};
  static readonly CAST_VOTE: SpinnerInfo = {description: 'Message.Spinner.Cast-Vote'};
  static readonly EXCLUDE_MEMBERS: SpinnerInfo = {description: 'Message.Spinner.Exclude-Voter'};

  static readonly REMOVE_AUTHORITY: SpinnerInfo = {description: 'Message.Spinner.Remove-Authority'};
  static readonly CREATE_AUTHORITY: SpinnerInfo = {description: 'Message.Spinner.Add-Authority'};

  static readonly TOGGLE_MEETING_VISIBILITY: SpinnerInfo = {description: 'Message.Spinner.Toggle-Visibility'};
  static readonly DELETE_VOTING: SpinnerInfo = {description: 'Message.Spinner.Delete-Voting'};
}
