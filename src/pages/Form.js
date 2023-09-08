import { Navigate } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { pages } from "../components/utils/PageDirection";
import { FormProvider, useForm } from "react-hook-form";
import InputText from "../components/utils/inputText";
import { fileUploadConfig, inputTextConfig } from "../components/config/formConfig";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { awsConfig } from "../components/config/awsConfig";
import { nanoid } from "nanoid";

export default function Form() {
  const auth = useAuth();

  const methods = useForm({
    mode: "all",
    defaultValues: {
      inputText: "",
      fileUpload: null,
    },
  });

  if (!auth.user){
    return <Navigate to={pages.auth.login} />;
  }
  if (auth.user) {
    if (!auth.user.verified) return <Navigate to={pages.auth.confirm_user} />;
  }


  const onSubmit = methods.handleSubmit((data) => {

    let COGNITO_ID = `cognito-idp.${awsConfig.region}.amazonaws.com/${awsConfig.UserPoolId}`;
    let loginData = {
      [COGNITO_ID]: auth.user.idToken,
    };
    const s3Client = new S3Client({
      region: awsConfig.region,
      credentials: fromCognitoIdentityPool({
        clientConfig: { region: awsConfig.region },
        identityPoolId: awsConfig.IdentityPoolId,
        logins: loginData,
      }),
    });

    const uploadFile = async (fileName = "abc.txt", fileContent = "abc") => {
      const command = new PutObjectCommand({
        Bucket: awsConfig.S3Bucket,
        Key: fileName,
        Body: fileContent,
      });

      try {
        const response = await s3Client.send(command);
        console.log(response);
      } catch (err) {
        console.error(err);
      }
    };

    uploadFile(data.fileUpload[0].name, data.fileUpload[0]);

    const urlPayload = {
      id: nanoid(),
      input_text: data.inputText,
      input_file_path: `${awsConfig.S3Bucket}/${data.fileUpload[0].name}`,
    };

    const response = fetch(awsConfig.ApiBaseURL, {
      method: "POST",
      headers: {
        "Authorization": auth.user.idToken,
      },
      body: JSON.stringify(urlPayload),
    });
    console.log(response);
  });

  return (
    <div className="form">
      <h1 className="mb-4 text-3xl tracking-tight font-extrabold text-center text-gray-900 dark:text-white">
        Input form
      </h1>
      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <InputText {...inputTextConfig} />
          <InputText {...fileUploadConfig} />
          <div>
            <button
              onClick={onSubmit}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Submit
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
