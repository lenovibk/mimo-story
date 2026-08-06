// Jenkinsfile — CI/CD pipeline cho MimoKids2 (app + admin + server)
//
// Yêu cầu trên Jenkins agent:
//   - Docker + Docker Compose plugin (lệnh `docker compose ...`)
//   - Quyền chạy docker của user chạy Jenkins (thường phải thêm user `jenkins`
//     vào group `docker` trên máy chủ)
//   - File server/.env (và server/.env.production khi deploy prod) đã tồn tại
//     sẵn trên máy chủ, KHÔNG commit vào git (xem docs/jenkins-deploy.md)
//
// Xem hướng dẫn kết nối Jenkins <-> GitHub tại docs/jenkins-deploy.md

pipeline {
    agent any

    options {
        // Không cho 2 build chạy song song đè lên nhau (cùng dùng chung
        // container name / port trên máy chủ)
        disableConcurrentBuilds()
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['production', 'staging'],
            description: 'Môi trường deploy'
        )
    }

    environment {
        COMPOSE_FILES = "${params.ENVIRONMENT == 'production' ? '-f docker-compose.yml -f docker-compose.prod.yml' : '-f docker-compose.yml'}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                }
                echo "Deploying commit ${env.GIT_COMMIT_SHORT} to ${params.ENVIRONMENT}"
            }
        }

        stage('Sanity check env files') {
            steps {
                // server/.env(.production) chứa secret nên không nằm trong git —
                // pipeline chỉ kiểm tra là nó có mặt trên máy chủ, không tạo ra nó.
                sh '''
                    set -e
                    if [ "${ENVIRONMENT}" = "production" ] && [ ! -f server/.env.production ]; then
                        echo "Thiếu server/.env.production trên máy chủ Jenkins agent." >&2
                        exit 1
                    fi
                    if [ ! -f server/.env ]; then
                        echo "Thiếu server/.env trên máy chủ Jenkins agent." >&2
                        exit 1
                    fi
                '''
            }
        }

        stage('Build images') {
            steps {
                sh "docker compose ${COMPOSE_FILES} build --pull"
            }
        }

        stage('Deploy') {
            steps {
                sh "docker compose ${COMPOSE_FILES} up -d --force-recreate"
            }
        }

        stage('Cleanup old images') {
            steps {
                // Xoá image/layer cũ không còn container nào dùng, tránh đầy ổ đĩa.
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo "Deploy thành công: ${env.GIT_COMMIT_SHORT} -> ${params.ENVIRONMENT}"
        }
        failure {
            echo "Deploy thất bại. Xem log ở trên để biết stage nào lỗi."
        }
    }
}
