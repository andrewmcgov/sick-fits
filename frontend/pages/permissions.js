import PleaseSignIn from '../components/PleaseSignIn';
import Permissions from '../components/Permissions';

const permissions = props => {
  return (
    <div>
      <PleaseSignIn>
        <Permissions />
      </PleaseSignIn>
    </div>
  );
};

export default permissions;
