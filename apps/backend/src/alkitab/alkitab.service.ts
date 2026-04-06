import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchVersesDto } from './dto/search-verses.dto';

const toNumber = (value: number | bigint) =>
  typeof value === 'bigint' ? Number(value) : value;

@Injectable()
export class AlkitabService {
  constructor(private readonly prisma: PrismaService) {}

  async getBooks() {
    const [books, chapterCounts] = await Promise.all([
      this.prisma.book.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.chapter.groupBy({
        by: ['bookid'],
        _count: { id: true },
      }),
    ]);

    const chapterCountMap = new Map(
      chapterCounts.map((item) => [item.bookid, item._count.id]),
    );

    return books.map((book) => ({
      id: book.id,
      abbr: book.abbr,
      totalChapters: chapterCountMap.get(book.id) ?? 0,
    }));
  }

  async getChaptersByBook(bookId: number) {
    const [book, rawChapters] = await Promise.all([
      this.prisma.book.findUnique({ where: { id: bookId } }),
      this.prisma.chapter.findMany({
        where: { bookid: bookId },
        orderBy: { number: 'asc' },
        select: { id: true, number: true },
      }),
    ]);

    if (!book) {
      throw new NotFoundException(`Book dengan id ${bookId} tidak ditemukan`);
    }

    const chapters = rawChapters.map((chapter) => ({
      id: toNumber(chapter.id),
      number: chapter.number,
    }));

    return {
      book: { id: book.id, abbr: book.abbr },
      chapters,
    };
  }

  async getChapterVerses(bookId: number, chapterNumber: number) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { bookid: bookId, number: chapterNumber },
      include: { Book: true },
    });

    if (!chapter) {
      throw new NotFoundException(
        `Pasal ${chapterNumber} untuk kitab dengan id ${bookId} tidak ditemukan`,
      );
    }

    const verses = await this.prisma.verse.findMany({
      where: { chapterid: chapter.id },
      orderBy: { number: 'asc' },
      select: {
        id: true,
        number: true,
        text: true,
        title: true,
      },
    });

    return {
      book: { id: chapter.Book.id, abbr: chapter.Book.abbr },
      chapter: { id: toNumber(chapter.id), number: chapter.number },
      verses,
    };
  }

  async getSingleVerse(
    bookId: number,
    chapterNumber: number,
    verseNumber: number,
  ) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { bookid: bookId, number: chapterNumber },
      select: { id: true },
    });

    if (!chapter) {
      throw new NotFoundException(
        `Pasal ${chapterNumber} untuk kitab dengan id ${bookId} tidak ditemukan`,
      );
    }

    const verse = await this.prisma.verse.findFirst({
      where: { chapterid: chapter.id, number: verseNumber },
      include: {
        Book: true,
        Chapter: true,
      },
    });

    if (!verse) {
      throw new NotFoundException(
        `Ayat ${verseNumber} tidak ditemukan untuk kitab ${bookId} pasal ${chapterNumber}`,
      );
    }

    return {
      id: verse.id,
      book: { id: verse.Book.id, abbr: verse.Book.abbr },
      chapter: { id: toNumber(verse.Chapter.id), number: verse.Chapter.number },
      verse: { number: verse.number, title: verse.title, text: verse.text },
    };
  }

  async searchVerses(dto: SearchVersesDto) {
    const keyword = dto.keyword?.trim();
    if (!keyword) {
      throw new BadRequestException('Keyword pencarian wajib diisi');
    }

    const limit = dto.limit ?? 20;

    const verses = await this.prisma.verse.findMany({
      where: {
        OR: [
          { text: { contains: keyword, mode: 'insensitive' } },
          { title: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      orderBy: { id: 'asc' },
      take: limit,
      include: {
        Book: true,
        Chapter: true,
      },
    });

    return verses.map((verse) => ({
      id: verse.id,
      book: { id: verse.Book.id, abbr: verse.Book.abbr },
      chapter: { id: toNumber(verse.Chapter.id), number: verse.Chapter.number },
      verse: { number: verse.number, title: verse.title, text: verse.text },
    }));
  }
}
