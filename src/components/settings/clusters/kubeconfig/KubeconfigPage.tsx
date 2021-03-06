import {
  IonAlert,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
  isPlatform,
} from '@ionic/react';
import yaml from 'js-yaml';
import React, { useContext, useState } from 'react';
import { RouteComponentProps } from 'react-router';

import {
  ICluster,
  IContext,
  IKubeconfig,
  IKubeconfigCluster,
  IKubeconfigClusterRef,
  IKubeconfigUser,
  IKubeconfigUserRef
} from '../../../../declarations';
import { AppContext } from '../../../../utils/context';
import Editor from '../../../misc/Editor';

const getKubeconfigCluster = (name: string, clusters: IKubeconfigClusterRef[]): IKubeconfigCluster|null => {
  for (let cluster of clusters) {
    if (cluster.name === name) {
      return cluster.cluster
    }
  }

  return null
};

const getKubeconfigUser = (name: string, users: IKubeconfigUserRef[]): IKubeconfigUser|null => {
  for (let user of users) {
    if (user.name === name) {
      return user.user;
    }
  }

  return null
};

interface IKubeconfigPageProps extends RouteComponentProps {}

const KubeconfigPage: React.FunctionComponent<IKubeconfigPageProps> = ({ history }) => {
  const context = useContext<IContext>(AppContext);

  const [error, setError] = useState<string>('');
  const [kubeconfig, setKubeconfig] = useState<string>('');

  const handleKubeconfig = (event) => {
    setKubeconfig(event.target.value);
  };

  const addClusters = () => {
    if (kubeconfig === '') {
      setError('Kubeconfig is required')
    } else {
      try {
        const clusters: ICluster[] = [];
        const config: IKubeconfig = yaml.safeLoad(kubeconfig);

        for (let ctx of config.contexts) {
          const cluster = getKubeconfigCluster(ctx.context.cluster, config.clusters);
          const user = getKubeconfigUser(ctx.context.user, config.users);

          if (ctx.name === '' || cluster === null || user === null || !cluster.server || !cluster['certificate-authority-data'] || !((user['client-certificate-data'] && user['client-key-data']) || user.token || !(user.username && user.password))) {
            throw new Error('Invalid kubeconfig');
          }

          clusters.push({
            id: '',
            name: ctx.name,
            url: cluster.server,
            certificateAuthorityData: cluster['certificate-authority-data'],
            clientCertificateData: user['client-certificate-data'] ? user['client-certificate-data'] : '',
            clientKeyData: user['client-key-data'] ? user['client-key-data'] : '',
            token: user.token ? user.token : '',
            username: user.username ? user.username : '',
            password: user.password ? user.password : '',
            authProvider: '',
            namespace: 'default',
          });
        }

        context.addCluster(clusters);
        setError('');
        history.push('/settings/clusters');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings/clusters" />
          </IonButtons>
          <IonTitle>Add Clusters</IonTitle>
          {error ? null : (
            <IonButtons slot="primary">
              <IonButton onClick={() => addClusters()}>
                Add
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {isPlatform('hybrid') ? (
          <IonList lines="full">
            <IonItem>
              <IonLabel position="stacked">Kubeconfig</IonLabel>
              <IonTextarea autoGrow={true} value={kubeconfig} onInput={handleKubeconfig} />
            </IonItem>
          </IonList>
        ) : (
          <Editor
            readOnly={false}
            value={kubeconfig}
            fullHeight={true}
            mode="yaml"
            onChange={(newValue: string) => setKubeconfig(newValue)}
          />
        )}

        {error !== '' ? (
          <IonAlert
            isOpen={error !== ''}
            onDidDismiss={() => setError('')}
            header="Could not save"
            message={error}
            buttons={['OK']}
          />
        ) : null}
      </IonContent>
    </IonPage>
  );
};

export default KubeconfigPage;
