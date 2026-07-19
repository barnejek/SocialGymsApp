export type UserPersona = 'b2c_user' | 'b2b_autism_user' | 'b2b_educator';

export interface UserProfile {
  id: string;
  persona: UserPersona;
  name: string;
  company?: string;
  autismProfile?: {
    sensoryProfile: 'seek' | 'avoid' | 'mixed';
    communicationStyle: 'glp' | 'analytical' | 'mixed';
    iepGoals: string[];
  };
}

export const MOCK_USERS: Record<UserPersona, UserProfile> = {
  'b2c_user': {
    id: 'user_1',
    persona: 'b2c_user',
    name: 'Alex (B2C Pro)',
  },
  'b2b_autism_user': {
    id: 'user_2',
    persona: 'b2b_autism_user',
    name: 'Sam (Autism Module)',
    company: 'New Hope Clinic',
    autismProfile: {
      sensoryProfile: 'avoid',
      communicationStyle: 'glp',
      iepGoals: ['Initiate greetings', 'Request breaks calmly']
    }
  },
  'b2b_educator': {
    id: 'user_3',
    persona: 'b2b_educator',
    name: 'Dr. Sarah (Educator)',
    company: 'New Hope Clinic',
  }
};
