FROM public.ecr.aws/codebuild/amazonlinux2-aarch64-standard:3.0

ENV TERRAFORM_VERSION=1.9.0

RUN yum -y update && \
    yum -y install unzip && \
    yum clean all

RUN curl -LO https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_arm64.zip && \
    unzip terraform_${TERRAFORM_VERSION}_linux_arm64.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform_${TERRAFORM_VERSION}_linux_arm64.zip