
import select from '@inquirer/select';
import SignUp from './createUser';
import login from './login';
import forgotPassword from './forgotPass';

const Start = async ()=>{

    type Answer = 'signup'|'login'|'reset-password'
    const answer = await select({
        message: 'Select route to test',
        choices: [
          {
            name: 'Sign up',
            value: 'signup',
            description: 'Test user account creation',
          },
          {
            name: 'Log in',
            value: 'login',
            description: 'Test user log in',
          },
          {
            name:"reset password",
            value:'reset-password',
            description:"reset your password"
          }
        ],
    });

      switch (answer as Answer) {
        case 'signup':
            await SignUp();
            break;
        case 'login':
            await login();
            break;
        case 'reset-password':
            await forgotPassword();
            break;
      }
}

Start()