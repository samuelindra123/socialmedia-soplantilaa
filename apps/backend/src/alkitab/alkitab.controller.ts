import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AlkitabService } from './alkitab.service';
import { SearchVersesDto } from './dto/search-verses.dto';

@ApiTags('Alkitab')
@Controller('alkitab')
export class AlkitabController {
  constructor(private readonly alkitabService: AlkitabService) {}

  @Get('books')
  @Public()
  @ApiOperation({ summary: 'Mengambil daftar kitab beserta total pasal' })
  getBooks() {
    return this.alkitabService.getBooks();
  }

  @Get('books/:bookId/chapters')
  @Public()
  @ApiOperation({ summary: 'Mengambil daftar pasal berdasarkan kitab' })
  getChaptersByBook(@Param('bookId', ParseIntPipe) bookId: number) {
    return this.alkitabService.getChaptersByBook(bookId);
  }

  @Get('books/:bookId/chapters/:chapterNumber/verses')
  @Public()
  @ApiOperation({ summary: 'Mengambil seluruh ayat pada pasal tertentu' })
  getVerses(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
  ) {
    return this.alkitabService.getChapterVerses(bookId, chapterNumber);
  }

  @Get('books/:bookId/chapters/:chapterNumber/verses/:verseNumber')
  @Public()
  @ApiOperation({ summary: 'Mengambil satu ayat tertentu' })
  getSingleVerse(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
    @Param('verseNumber', ParseIntPipe) verseNumber: number,
  ) {
    return this.alkitabService.getSingleVerse(
      bookId,
      chapterNumber,
      verseNumber,
    );
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Pencarian ayat berdasarkan keyword' })
  searchVerses(@Query() dto: SearchVersesDto) {
    return this.alkitabService.searchVerses(dto);
  }
}
