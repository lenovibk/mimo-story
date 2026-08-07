// Jenkinsfile — CI/CD pipeline cho MimoKids2 (app + admin + server)
//
// Yêu cầu trên Jenkins agent:
//   - Docker + Docker Compose plugin (lệnh `docker compose ...`)
//   - Quyền chạy docker của user chạy Jenkins (thường phải thêm user `jenkins`
//     vào group `docker` trên máy chủ)
//   - 2 credential kiểu "Secret file" đã tạo trong Jenkins web UI:
//       mimokids-server-env             -> nội dung server/.env
//       mimokids-server-env-production  -> nội dung server/.env.production
//     (chỉ bắt buộc khi ENVIRONMENT=production). Xem cách tạo ở
//     docs/jenkins-deploy.md mục 4.
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

        stage('Load env secrets') {
            steps {
                // server/.env(.production) chứa secret nên không commit vào git.
                // Thay vì phải SSH vào máy chủ để tạo file tay, secret được lưu
                // trong Jenkins Credentials (kiểu "Secret file", tạo qua web UI —
                // xem docs/jenkins-deploy.md mục 4) và Jenkins tự ghi ra workspace
                // ở đây, ngay trước khi build.
                withCredentials([file(credentialsId: 'mimokids-env-prod', variable: 'ENV_FILE')]) {
                    sh 'cp "$ENV_FILE" server/.env'
                }
                script {
                    if (params.ENVIRONMENT == 'production') {
                        withCredentials([file(credentialsId: 'mimokids-env-prod', variable: 'ENV_FILE_PROD')]) {
                            sh 'cp "$ENV_FILE_PROD" server/.env.production'
                        }
                    }
                }
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
