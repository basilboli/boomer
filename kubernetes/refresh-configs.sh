kubectl delete configmaps nginx-frontend-conf
kubectl create configmap nginx-frontend-conf --from-file nginx/frontend.conf
kubectl get configmaps nginx-frontend-conf -o yaml
kubectl scale deployment/frontend --replicas 0
kubectl scale deployment/frontend --replicas 1