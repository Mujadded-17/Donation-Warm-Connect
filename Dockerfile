FROM php:8.2-apache

# Build arguments
ARG APP_NAME=DonationApp
ARG APP_ENV=local
ARG APP_KEY=
ARG APP_DEBUG=true
ARG APP_URL=http://localhost:8080
ARG FRONTEND_URL=http://localhost:8080
ARG LOG_LEVEL=debug
ARG DB_CONNECTION=mysql
ARG DB_HOST=db
ARG DB_PORT=3306
ARG DB_DATABASE=donation_app
ARG DB_USERNAME=root
ARG DB_PASSWORD=root
ARG VITE_BACKEND_ENDPOINT=http://localhost:8080

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache rewrite
RUN a2enmod rewrite

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Set Apache document root to Laravel public/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy backend and frontend code
COPY server/ /var/www/html/
COPY client/ /var/www/html/client/

# Set working directory
WORKDIR /var/www/html

# Install Laravel dependencies
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Create Laravel .env file
RUN printf "APP_NAME=%s\nAPP_ENV=%s\nAPP_KEY=%s\nAPP_DEBUG=%s\nAPP_URL=%s\nFRONTEND_URL=%s\nLOG_LEVEL=%s\nDB_CONNECTION=%s\nDB_HOST=%s\nDB_PORT=%s\nDB_DATABASE=%s\nDB_USERNAME=%s\nDB_PASSWORD=%s\n" \
    "$APP_NAME" \
    "$APP_ENV" \
    "$APP_KEY" \
    "$APP_DEBUG" \
    "$APP_URL" \
    "$FRONTEND_URL" \
    "$LOG_LEVEL" \
    "$DB_CONNECTION" \
    "$DB_HOST" \
    "$DB_PORT" \
    "$DB_DATABASE" \
    "$DB_USERNAME" \
    "$DB_PASSWORD" > /var/www/html/.env

# Build frontend
WORKDIR /var/www/html/client
ENV VITE_BACKEND_ENDPOINT=${VITE_BACKEND_ENDPOINT}
RUN npm install
RUN npm run build

# Copy built frontend into Laravel public/
WORKDIR /var/www/html
RUN cp -r client/dist/* public/

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# Expose Apache port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]