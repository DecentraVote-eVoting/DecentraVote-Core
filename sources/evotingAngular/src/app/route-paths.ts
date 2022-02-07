/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
export const ROUTE_PATHS = {
  EXTERNAL_AUTH: 'external-auth',
  EXTERNAL_LOGOUT: 'external-logout',
  TOKEN_AUTH: 'token-auth',

  SETUP: 'setup',
  LOGIN: 'login',
  LOGIN_RESPONSE: 'login-response',
  REGISTER_ETH_ADDRESS: 'register-eth',
  LINK_ETH_ADDRESS: 'link-eth',
  RECOVERY: 'recovery',

  MEETING: 'meeting',
  MEETING_OVERVIEW: 'meeting/overview',
  MEETING_DETAIL: 'meeting/detail',
  MEETING_SUMMARY: 'meeting/summary',

  MEMBER: 'member',
  MEMBER_OVERVIEW: 'member/overview',
  MEMBER_IMPORT: 'member/import',

  VERIFICATION: 'verification/:meetingAddress/:voteAddress'
};
