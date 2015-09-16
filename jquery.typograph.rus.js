(function ($) {
    $.fn.typograph = function (params) {
        var self = this,
            $text = $(self),
            // основные предлоги русского языка
            defaults = {
                dash: true,
                quotes: true,
                prepositions: true,

                processOnType: true, // обрабатывать ли вводимые с клавиатуры данные
                processOnPaste: true, // обрабатывать ли вставку из буфера обмена

                nbsp: ' ', // тут неразрывный пробел UTF-8
                prepositionsList: ['без', 'безо', 'близ', 'в', 'вне', 'во', 'для', 'до', 'за', 'из', 'из-за', 'из-под',
                    'изо', 'к', 'ко', 'между', 'на', 'над', 'о', 'об', 'обо', 'около', 'от', 'ото', 'по', 'по-за',
                    'по-над', 'по-под', 'под', 'подо', 'при', 'про', 'с', 'со', 'у', 'через'],

                dashPattern: ' - ',
                dashValue: ' — ', // первый пробел тоже неразрывный

                quotePattern: '"',
                quoteOpen: '«',
                quoteClose: '»'
            };

        if ($text.length == 0) {
            return self;
        }

        // IE8- лесом
        if ($text[0].selectionStart === undefined) {
            return self;
        }
        params = $.extend({}, defaults, params);

        if ($text.length) {
            if (params.processOnType) {
                $text.on('keyup', function () {
                    // сохраняем позицию курсора в тексте, т.к. она сбрасывается
                    var $current = $(this),
                        startPosition = $current[0].selectionStart,
                        endPosition = $current[0].selectionEnd,
                        savePosition = startPosition == endPosition; // если выделен фрагмент, не трогаем

                    // расстановка тире
                    if (params.dash) {
                        var text = $current.val(),
                            changed = false,
                            preString = text.substring(startPosition - params.dashPattern.length, startPosition);
                        if (preString == params.dashPattern) {
                            text = text.substring(0, startPosition - params.dashPattern.length) + params.dashValue +
                            text.substring(startPosition, text.length);
                            changed = true;
                        }
                    }

                    // расстановка кавычек
                    if (params.quotes) {
                        var quoteOpened = false, quoteClosed = false;
                        if (text.substring(startPosition - 1, startPosition) == params.quotePattern) {
                            for (var i = startPosition; i > 0; i--) {
                                var current = text.substring(i - 1, i);
                                if (current == params.quoteOpen) {
                                    quoteOpened = true;
                                    break;
                                } else if (current == params.quoteClose) {
                                    quoteOpened = false;
                                    break;
                                }
                            }
                            if (quoteOpened) {
                                for (var i = startPosition + 1; i <= text.length; i++) {
                                    if (text.substring(i - 1, i) == params.quoteClose) {
                                        quoteClosed = true;
                                        break;
                                    }
                                }
                            }
                            if (!quoteClosed) {
                                text = text.substring(0, startPosition - 1) +
                                (quoteOpened ? params.quoteClose : params.quoteOpen) +
                                text.substring(startPosition, text.length);
                            }
                            changed = true;
                        }
                    }

                    // обработка предлогов
                    if (params.prepositions) {
                        for (var i = 0; i < params.prepositionsList.length; i++) {
                            var pLength = params.prepositionsList[i].length,
                                fragment = text.substring(startPosition - pLength - 2, startPosition).toLowerCase(),

                                // если в начале строки, сравниваем без начального пробела
                                preposition = (startPosition - pLength > 2 ? ' ' : '') +
                                    params.prepositionsList[i] + ' ';

                            if (fragment == preposition) {
                                text = text.substring(0, startPosition - 1) + params.nbsp +
                                text.substring(startPosition, text.length);
                                changed = true;
                            }
                        }
                    }

                    // без нужды контент не трогаем
                    if (changed) {
                        $current.val(text);
                    }

                    // восстанавливаем позицию в тексте
                    if (savePosition) {
                        $current[0].selectionStart = startPosition;
                        $current[0].selectionEnd = endPosition;
                    }
                });
            }

            if (params.processOnPaste) {
                $text.on('paste', function (event) {
                    var originalText, newText,
                        $element = $(this);
                    if (event.originalEvent.clipboardData) {
                        if (originalText = event.originalEvent.clipboardData.getData('text/plain')) {

                            // тут не так важна производительность, так что воспользуемся RegExp
                            newText = originalText.replace(
                                new RegExp(params.dashPattern, 'g'),
                                params.dashValue
                            );

                            newText = newText.replace(
                                new RegExp(
                                    params.quotePattern + '([^' + params.quotePattern + ']*)' + params.quotePattern,
                                    'g'
                                ),
                                params.quoteOpen + '$1' + params.quoteClose
                            );

                            for (var i = 0; i < params.prepositionsList.length; i++) {
                                newText = newText.replace(
                                    new RegExp('((^|[^А-Яа-я])' + params.prepositionsList[i] + ')\\s', 'gi'),
                                     '$1' + params.nbsp
                                );
                            }

                            setTimeout(function () { // после вставки заменяем исходный текст на обработанный
                                $element.val($element.val().replace(originalText, newText));
                            }, 0);
                        }
                    }
                });
            }


        }
        return self;
    };
}) (jQuery);
