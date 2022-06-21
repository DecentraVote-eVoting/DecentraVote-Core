/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
export const ROUTE_PATHS = {
  EXTERNAL_AUTH: 'external-auth',
  EXTERNAL_LOGOUT: 'external-logout',

  SETUP: 'setup',
  LINK_ETH_ADDRESS: 'link-eth',

  MEETING: 'meeting',
  MEETING_OVERVIEW: 'meeting/overview',
  MEETING_DETAIL: 'meeting/detail',
  MEETING_SUMMARY: 'meeting/summary',

  MEMBER: 'member',
  MEMBER_OVERVIEW: 'member/overview',
  MEMBER_IMPORT: 'member/import',

  VERIFICATION: 'verification/:meetingAddress/:voteAddress',
  CERTIFICATE: 'certificate/:meetingAddress/:voteAddress'
};
