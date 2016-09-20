#!/bin/bash
export GOOGLE_APPLICATION_CREDENTIALS=/Users/basilboli/dev/google/serviceaccount/boomer-92c5f59548fa.json
gcloud config configurations activate boomer
gcloud config set project boomer-1470064436690
gcloud container clusters get-credentials boomer-cluster