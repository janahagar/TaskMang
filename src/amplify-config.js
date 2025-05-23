import { fetchAuthSession } from '@aws-amplify/auth';

const config = {
    Auth: {
        Cognito: {
            userPoolId: 'eu-north-1_bhStBghE3',
            userPoolClientId: 'j5uak0afholcpcfijvrvgqg5g',
            signUpVerificationMethod: 'code',
            loginWith: {
                email: true,
                phone: false,
                username: true
            }
        },
        region: 'eu-north-1'
    },
    API: {
        endpoints: [
            {
                name: 'TaskManagerAPI',
                endpoint: 'https://ec4rjesbcg.execute-api.eu-north-1.amazonaws.com/prod', // Your API Gateway URL
                region: 'eu-north-1',
                custom_header: async () => {
                    const session = await fetchAuthSession();
                    return {
                        Authorization: `Bearer ${session.tokens.idToken.toString()}`
                    }
                }
            }
        ]
    }
};

export default config; 