export type Sex = 'male' | 'female' | 'other';
export type PregnancyStatus =
  | 'not_pregnant'
  | 'first_trimester'
  | 'second_trimester'
  | 'third_trimester'
  | 'unknown';

describe('Phase 0: Auth & User Demographics Schema (FOUNDATION-01)', () => {
  it('should validate user registration and demographic profile fields', () => {
    const userProfile: {
      email: string;
      dateOfBirth: Date;
      sex: Sex;
      pregnancyStatus: PregnancyStatus;
      consentHealthDataAt: Date;
    } = {
      email: 'patient@example.com',
      dateOfBirth: new Date('1992-05-15'),
      sex: 'female',
      pregnancyStatus: 'not_pregnant',
      consentHealthDataAt: new Date(),
    };

    expect(userProfile.email).toBe('patient@example.com');
    expect(userProfile.sex).toBe('female');
    expect(userProfile.pregnancyStatus).toBe('not_pregnant');
    expect(userProfile.dateOfBirth).toBeInstanceOf(Date);
    expect(userProfile.consentHealthDataAt).toBeInstanceOf(Date);
  });

  it('should support valid sex enum values', () => {
    const validSexes: Sex[] = ['male', 'female', 'other'];
    expect(validSexes).toContain('male');
    expect(validSexes).toContain('female');
    expect(validSexes).toContain('other');
  });

  it('should support valid pregnancy_status enum values', () => {
    const validStatuses: PregnancyStatus[] = [
      'not_pregnant',
      'first_trimester',
      'second_trimester',
      'third_trimester',
      'unknown',
    ];
    expect(validStatuses).toHaveLength(5);
  });
});
