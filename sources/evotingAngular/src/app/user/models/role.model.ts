/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
export class Role {
  static readonly NONE: Role = new Role(0b000);
  static readonly GUEST: Role = new Role(0b001);
  static readonly MEMBER: Role = new Role(0b010);
  static readonly DIRECTOR: Role = new Role(0b100);
  static readonly ALL = {'NONE': Role.NONE, 'GUEST': Role.GUEST,
    'MEMBER': Role.MEMBER, 'DIRECTOR': Role.DIRECTOR};

  static readonly validRoles: number [] = [
    Role.MEMBER.value,
    Role.GUEST.value,
    Role.DIRECTOR.value + Role.MEMBER.value
  ];

  value: number;

  static isValidRole(role: number): boolean {
    return this.validRoles.includes(role);
  }

  static getRoleString(userRole: Role): string {
    let result = '';
    Object.keys(this.ALL).forEach(role => {
      if (this.ALL[role].isRole(userRole)) {
        result += `${role}/`;
      }
    });
    return result.slice(0, -1);
  }

  static findMostSignificantRole(userRole: Role) {
    let result = Role.NONE;
    for (const role of Object.keys(this.ALL)) {
      if (userRole.value & this.ALL[role].value) {
        result = this.ALL[role].value;
      }
    }
    return result;
  }

  constructor(value: number) {
    this.value = value;
  }

  isRole(other: Role | number): boolean {
    other = other instanceof Role ? other.value : other;
    return !!(this.value & other);
  }

  addGuestRole(): Role {
    const newValue = this.value | Role.GUEST.value;
    return new Role(newValue);
  }

  removeGuestRole(): Role {
    const newValue = this.value & ~Role.GUEST.value;
    return new Role(newValue);
  }

  addMemberRole(): Role {
    const newValue = this.value | Role.MEMBER.value;
    return new Role(newValue);
  }

  removeMemberRole(): Role {
    const newValue = this.value & ~Role.MEMBER.value;
    return new Role(newValue);
  }

  addDirectorRole(): Role {
    const newValue = this.value | Role.DIRECTOR.value;
    return new Role(newValue);
  }

  removeDirectorRole(): Role {
    const newValue = this.value & ~Role.DIRECTOR.value;
    return new Role(newValue);
  }
}
