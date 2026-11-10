import React from 'react';
import {
  HeartPulse,
  Sparkles,
  Baby,
  Bone,
  Stethoscope,
  Brain,
  Activity,
  Eye,
  Smile,
  UserCheck,
  LucideProps,
} from 'lucide-react';

interface IconHelperProps extends LucideProps {
  name: string;
}

export const SpecialtyIcon: React.FC<IconHelperProps> = ({ name, ...props }) => {
  switch (name) {
    case 'HeartPulse':
      return <HeartPulse {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Baby':
      return <Baby {...props} />;
    case 'Bone':
      return <Bone {...props} />;
    case 'Stethoscope':
      return <Stethoscope {...props} />;
    case 'Brain':
      return <Brain {...props} />;
    case 'Activity':
      return <Activity {...props} />;
    case 'Eye':
      return <Eye {...props} />;
    case 'Smile':
      return <Smile {...props} />;
    case 'UserCheck':
      return <UserCheck {...props} />;
    default:
      return <Stethoscope {...props} />;
  }
};
