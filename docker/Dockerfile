FROM php:7.3-apache

# Install utilities and PHP extensions
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    vim \
    less \
    && rm -rf /var/lib/apt/lists/*

# Install PHP mysqli extension
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Enable Apache modules
RUN a2enmod rewrite headers

# Configure PHP
RUN echo "upload_tmp_dir = /var/www/html/tmp/php_upload" >> /usr/local/etc/php/php.ini-production && \
    echo "sys_temp_dir = /var/www/html/tmp" >> /usr/local/etc/php/php.ini-production && \
    echo "session.save_path = /var/www/html/tmp/sessions" >> /usr/local/etc/php/php.ini-production && \
    echo "display_errors = On" >> /usr/local/etc/php/php.ini-production && \
    echo "error_reporting = E_ALL" >> /usr/local/etc/php/php.ini-production && \
    cp /usr/local/etc/php/php.ini-production /usr/local/etc/php/php.ini

# Copy site files - each directory separately to preserve structure
COPY api/ /var/www/html/api/
COPY css/ /var/www/html/css/
COPY js/ /var/www/html/js/
COPY index.html /var/www/html/index.html

# Copy uploads directory (including hidden files)
COPY uploads/ /var/www/html/uploads/

# Copy Apache vhost config
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

# Create temp and upload directories, set permissions
RUN mkdir -p /var/www/html/tmp/php_upload /var/www/html/tmp/sessions /var/www/html/uploads/avatars && \
    chmod 777 /var/www/html/tmp /var/www/html/tmp/php_upload /var/www/html/tmp/sessions && \
    chmod -R 777 /var/www/html/uploads && \
    chown -R www-data:www-data /var/www/html/

EXPOSE 80
CMD ["apache2-foreground"]
